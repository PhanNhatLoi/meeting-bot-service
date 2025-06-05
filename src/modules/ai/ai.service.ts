import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as fs from 'fs';
import { exec } from 'child_process';
import { OpenAI } from 'openai';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import { MeetingService } from '@modules/meeting/meeting.service';
import { Meeting } from '@database/entities/meeting.entity';
import mongoose from 'mongoose';
import { extname } from 'path';
import {
  LANGUAGE_CODE,
  planLimit,
  SUMMARY_CORE,
  TRANSLATE_STATUS,
} from 'src/shared/enum';
import { EventsGateway } from '@modules/gateways/events.gateway';
import { Result } from 'src/base/response/result';
import { Results } from 'src/base/response/result-builder';
import { IIdentityService } from 'src/shared/services/identity.service.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WordAnalysisService } from '@modules/word-analysis/word-analysis.service';
import { ERRORS_DICTIONARY } from 'src/shared/constants/error-dictionary.constaint';
import { v1 as speech } from '@google-cloud/speech';
import { Translation } from '@database/entities/translation.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISegment } from './interfaces/segment';
import { google } from '@google-cloud/speech/build/protos/protos';
import { PassThrough } from 'stream';
import internal, { Writable } from 'stream';
import { NAME_QUEUE } from 'src/shared/bull.config';

@Injectable()
export class AiService {
  private readonly maxFileSize = 25 * 1024 * 1024; // 25MB
  private readonly maxFileTime = 600; //600s = 10p

  constructor(
    @Inject(forwardRef(() => MeetingService))
    private readonly _meetingService: MeetingService,
    private readonly _eventGateway: EventsGateway,
    private readonly _identityService: IIdentityService,
    @InjectQueue(NAME_QUEUE.SPEECH_TO_TEXT)
    private readonly speechToTextQueue: Queue,
    private readonly _wordAnalysisService: WordAnalysisService,
  ) {}

  private aiModel(model: string): { AI: any; model: string } {
    switch (model) {
      case SUMMARY_CORE.GPT:
        return {
          AI: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
          model: 'gpt-4o',
        };
      case SUMMARY_CORE.ALIBABA:
        return {
          AI: new OpenAI({
            apiKey: process.env.ALIBABA_DASHSCOPE_API_KEY,
            baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
          }),
          model: 'qwen-plus',
        };
      case SUMMARY_CORE.GEMINI:
        return {
          AI: new GoogleGenerativeAI(
            process.env.GEMINI_API_KEY,
          ).getGenerativeModel({ model: 'gemini-1.5-flash' }),
          model: 'gemini-1.5-flash',
        };
      default:
        throw new Error('Unsupported AI model');
    }
  }
  async convertWebmToMp3(inputPath: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'files', inputPath);
    const outputPath = filePath.replace(extname(filePath), '.mp3');
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .output(outputPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async speechToTextLocal(
    meeting: Meeting,
    summary: SUMMARY_CORE = null,
    language: string = 'vi',
    getSummaryText: boolean = false,
  ): Promise<string> {
    const meetingIdObject = new mongoose.Types.ObjectId(meeting.id);
    if (!meeting) {
      throw new BadRequestException('Audio file is required');
    }
    const audioFilePath = await this.convertWebmToMp3(meeting.recordUri);
    await this.updateAndSentEvent(meetingIdObject, {
      transcripts: [],
      status: TRANSLATE_STATUS.PROCESSING,
    });
    try {
      // Kiểm tra kích thước file
      const stats = fs.statSync(audioFilePath);
      if (stats.size <= this.maxFileSize) {
        // File nhỏ hơn 25MB, xử lý trực tiếp
        const transcription = await this.transcribeAudio(audioFilePath);
        this.cleanupFile(audioFilePath);
        await this.updateAndSentEvent(meetingIdObject, {
          transcripts: transcription?.map((segment) => {
            return {
              meeting: meeting._id as any,
              speaker: 'SPEAKER_01',
              start: segment.start * 1000,
              end: segment.end * 1000,
              time: '',
              newWords: false,
              transcript: segment.text,
            };
          }),
          status: TRANSLATE_STATUS.DONE,
        });
        if (getSummaryText) {
          const result = await this.summarizeText([], summary, language);

          this._eventGateway.handlePingSummary(
            this._identityService.id,
            meeting.id.toString(),
            { summaryCore: summary, summary: result },
          );

          await this._meetingService.updateMeeting(
            { _id: meeting._id },
            { summary: result, summaryCore: summary },
          );
        }
        return;
      }

      // File lớn hơn 25MB, cần chia nhỏ
      const tempDir = `files/uploads/temp-${Date.now()}`;
      fs.mkdirSync(tempDir);

      // Chia nhỏ file thành nhiều đoạn
      await this.splitAudioFile(audioFilePath, tempDir);

      // Xử lý từng đoạn
      const chunks = fs.readdirSync(tempDir).sort();
      const transcriptions = [];
      for (const index in chunks) {
        const chunkPath = path.join(tempDir, chunks[index]);
        const transcription = await this.transcribeAudio(chunkPath);
        transcription?.map((segment) => {
          transcriptions.push({
            meeting: meeting._id as any,
            speaker: 'SPEAKER_01',
            start: (Number(index) * this.maxFileTime + segment.start) * 1000,
            end: (Number(index) * this.maxFileTime + segment.end) * 1000,
            time: '',
            newWords: false,
            transcript: segment.text,
          });
        });
        this.cleanupFile(chunkPath);
      }

      // Cleanup thư mục tạm và file gốc
      fs.rmdirSync(tempDir);
      this.cleanupFile(audioFilePath);

      await this.updateAndSentEvent(meetingIdObject, {
        transcripts: transcriptions,
        status: TRANSLATE_STATUS.DONE,
      });

      if (getSummaryText) {
        const result = await this.summarizeText([], summary, language);

        this._eventGateway.handlePingSummary(
          this._identityService.id,
          meeting.id.toString(),
          { summaryCore: summary, summary: result },
        );

        await this._meetingService.updateMeeting(
          { _id: meeting._id },
          { summary: result, summaryCore: summary },
        );
      }
      return;
    } catch (error) {
      if (audioFilePath) {
        this.cleanupFile(audioFilePath);
      }
      await this.updateAndSentEvent(meetingIdObject, {
        transcripts: [],
        status: TRANSLATE_STATUS.FAILED,
      });
      if (summary) {
        this._eventGateway.handlePingSummary(
          this._identityService.id,
          meeting.id.toString(),
          { summaryCore: summary, summary: '' },
        );
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  private async transcribeAudio(filePath: string): Promise<ISegment[]> {
    try {
      const AI = this.aiModel(SUMMARY_CORE.GPT).AI;
      const transcription = await AI.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'verbose_json',
      });
      return transcription.segments;
    } catch (error) {
      throw new InternalServerErrorException(
        `Transcription failed: ${error.message}`,
      );
    }
  }

  private async splitAudioFile(
    inputPath: string,
    outputDir: string,
  ): Promise<void> {
    const splitCommand = `ffmpeg -i "${inputPath}" -f segment -segment_time ${this.maxFileTime} -c copy -fs ${this.maxFileSize} "${outputDir}/chunk%03d.mp3"`;

    return new Promise((resolve, reject) => {
      exec(splitCommand, (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(`Failed to split audio: ${stderr || error.message}`),
          );
        } else {
          resolve();
        }
      });
    });
  }

  private cleanupFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async updateAndSentEvent(
    meetingId: mongoose.Types.ObjectId,
    data: { status: TRANSLATE_STATUS; transcripts: Translation[] },
  ) {
    this._eventGateway.handlePingTranslation(
      this._identityService.id,
      meetingId.toString(),
      data,
    );
    await this._meetingService.updateMeeting(
      { _id: meetingId },
      { translateStatus: data.status, transcripts: data.transcripts },
    );
  }

  // Sumarizes
  async summarizeText(
    texts: Translation[],
    summaryCore: SUMMARY_CORE,
    language: string,
  ): Promise<string> {
    // todo choose summary core after
    try {
      const convertText = texts
        .map((text) => {
          return text.transcript;
        })
        .join('. ');
      const ai_model = this.aiModel(summaryCore);
      const promt = `Please analyze the following conversation (there may be one or more different speakers, I will separate the sentences with "."), and rewrite the overall summary by ${language} with a limit of 200 words . The dialogue I provide is: ${convertText}`;

      let completion;
      let summary;
      switch (summaryCore) {
        case SUMMARY_CORE.ALIBABA:
        case SUMMARY_CORE.GPT:
          completion = await ai_model.AI.chat.completions.create({
            model: ai_model.model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional assistant summarizing meeting content, or conversing with high accuracy with input in many different languages. The abstract should not exceed 200 words.',
              },
              { role: 'user', content: promt },
            ],
          });
          // Extract the summarized response
          summary = completion.choices[0]?.message?.content;
          break;
        case SUMMARY_CORE.GEMINI:
          completion = await ai_model.AI.generateContent([
            {
              text: `Please summary the following conversation (there may be one or more different speakers, I will separate the sentences with "."), rewrite and return just the overall summary by ${language} language with a limit of 200 words. The dialogue I provide is: ${convertText}`,
            },
          ]);

          summary = completion.response.text();
          break;

        default:
          throw new Error('Invalid summaryCore value');
      }

      if (!summary) {
        throw new Error('No response received from OpenAI');
      }

      return summary;
    } catch (error) {
      console.error('Error while summarizing text:', error);
      throw new InternalServerErrorException('Failed to summarize text');
    }
  }

  async getSummaryText(
    meetingId: string,
    summaryCore: SUMMARY_CORE,
    language: string = 'vi',
  ): Promise<Result<{ status: TRANSLATE_STATUS; data: string }>> {
    const meeting: Meeting = (
      (await this._meetingService.getMeeting({
        _id: new mongoose.Types.ObjectId(meetingId),
      })) as any
    ).toJSON();
    const checkIsActive = await this.checkCharacter(summaryCore);
    if (!checkIsActive) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.AVAILABLE_LIMIT,
        details: 'Limit character error',
      });
    }

    if (meeting.translationAI.length === 0) {
      // todo using queue
      await this.speechToTextQueue.add(NAME_QUEUE.SPEECH_TO_TEXT, {
        meetingId,
        summaryCore,
        language,
        getSummaryText: true,
      });
      // todo using queue
      return Results.success({ status: TRANSLATE_STATUS.PROCESSING, data: '' });
    } else {
      const result = await this.summarizeText(
        meeting.translationAI,
        summaryCore,
        language,
      );

      const res = await this._wordAnalysisService.getWordAnalysis({
        user: this._identityService._id,
        core: summaryCore,
      });
      await this._wordAnalysisService.update(
        { _id: res._id },
        {
          characterCountDay: res.characterCountDay + result.length,
          characterCountMonth: res.characterCountMonth + result.length,
        },
      );

      await this._meetingService.updateMeeting(
        { _id: new mongoose.Types.ObjectId(meetingId) },
        { summary: result, summaryCore: summaryCore },
      );
      return Results.success({ status: TRANSLATE_STATUS.DONE, data: result });
    }
  }

  async handleTranslationText(
    meetingId: string,
    summary: SUMMARY_CORE = null,
    language: string = 'vi',
  ): Promise<Result<any>> {
    try {
      return Results.success(
        await this.speechToTextQueue.add(NAME_QUEUE.SPEECH_TO_TEXT, {
          meetingId,
          summary,
          language,
        }),
      );
    } catch (error) {
      console.error('Failed to add job to queue:', error);
      throw new InternalServerErrorException('Failed to add job to queue');
    }
  }

  // Xử lý logic speech-to-text
  async processTranslationJob(
    meetingCode: string,
    summary: SUMMARY_CORE = null,
    language: string = 'vi',
    getSummaryText?: boolean,
  ): Promise<void> {
    const meeting = await this._meetingService.getMeeting({
      _id: new mongoose.Types.ObjectId(meetingCode),
    });

    // Chạy speech-to-text
    await this.speechToTextLocal(meeting, summary, language, getSummaryText);

    console.log(
      'Translation job processed successfully for meeting:',
      meetingCode,
    );
  }

  async checkCharacter(core: SUMMARY_CORE) {
    let currentWord = await this._wordAnalysisService.getWordAnalysis({
      user: this._identityService._id,
      core,
    });
    if (!currentWord) {
      currentWord = await this._wordAnalysisService.create({
        user: this._identityService._id,
        core,
      });
      return true;
    } else {
      const updateDataWordAnalysis = {
        recentMonth: currentWord.recentMonth,
        recentDate: currentWord.recentDate,
        characterCountMonth: currentWord.characterCountMonth,
        characterCountDay: currentWord.characterCountDay,
      };
      //not today
      if (
        !currentWord.recentDate ||
        new Date().toLocaleDateString() !==
          new Date(currentWord.recentDate).toLocaleDateString()
      ) {
        updateDataWordAnalysis.recentDate = new Date().toLocaleDateString();
        updateDataWordAnalysis.characterCountDay = 0;
      }
      if (
        !currentWord.recentMonth ||
        new Date().getMonth() !== new Date(currentWord.recentMonth).getMonth()
      ) {
        updateDataWordAnalysis.recentMonth = new Date().toLocaleDateString();
        updateDataWordAnalysis.characterCountMonth = 0;
      }

      await this._wordAnalysisService.update(
        { _id: currentWord._id },
        updateDataWordAnalysis,
      );

      //change to user plan
      const litmit = planLimit['Free'][core];
      if (
        updateDataWordAnalysis.characterCountDay >= litmit.characterDayLimit ||
        updateDataWordAnalysis.characterCountMonth >= litmit.characterMonthLimit
      )
        return false;
    }
    return true;
  }

  async chat(
    core: SUMMARY_CORE,
    meetingId: string,
    message: string,
  ): Promise<Result<string>> {
    try {
      const checkIsActive = await this.checkCharacter(core);
      if (!checkIsActive) {
        throw new BadRequestException({
          message: ERRORS_DICTIONARY.AVAILABLE_LIMIT,
          details: 'Limit character error',
        });
      }

      const meeting = (
        (await this._meetingService.getMeeting({
          _id: new mongoose.Types.ObjectId(meetingId),
        })) as any
      ).toJSON();

      let response;
      let result;
      const ai_model = this.aiModel(core);
      switch (core) {
        case SUMMARY_CORE.ALIBABA:
        case SUMMARY_CORE.GPT:
          let messages: {
            role: 'assistant' | 'system' | 'user';
            content: string;
          }[] = [];
          messages = meeting.chatWithAIAssistant || [];
          messages.push({ role: 'user', content: message });

          response = await ai_model.AI.chat.completions.create({
            model: ai_model.model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant. Answer questions based on previous conversations, answers will be in the same language as the question I asked',
              },
              {
                role: 'user',
                content:
                  meeting?.translationAI
                    ?.map((trans) => trans.transcript)
                    .join('. ') || '',
              },
              ...messages,
            ],
            max_tokens: 1000,
          });

          result = response.choices[0].message.content;

          messages.push({ role: 'assistant', content: result });

          await this._meetingService.updateMeeting(
            { _id: new mongoose.Types.ObjectId(meetingId) },
            { chatWithAIAssistant: JSON.stringify(messages) },
          );

          break;

        case SUMMARY_CORE.GEMINI:
          let messages_gemini: {
            role: 'user' | 'model';
            parts?: Object[];
            content?: string;
          }[] = [];
          messages_gemini = meeting.chatWithAIAssistant || [];

          let chat = await ai_model.AI.startChat({
            history: [
              ...(meeting.chatWithAIAssistant || []).map((chat) => {
                return {
                  role: chat.role === 'user' ? 'user' : 'model',
                  parts: [{ text: chat?.content }],
                };
              }),
              {
                role: 'user',
                parts: [
                  {
                    text:
                      meeting?.translationAI
                        ?.map((trans) => trans.transcript)
                        .join('. ') || '',
                  },
                ],
              },
            ],
          });

          response = await chat.sendMessage(message);
          result = response.response.text();
          messages_gemini.push({ role: 'user', content: message });

          messages_gemini.push({ role: 'model', content: result });

          await this._meetingService.updateMeeting(
            { _id: new mongoose.Types.ObjectId(meetingId) },
            { chatWithAIAssistant: JSON.stringify(messages_gemini) },
          );
          break;
      }

      const res = await this._wordAnalysisService.getWordAnalysis({
        user: this._identityService._id,
        core,
      });

      if (res) {
        await this._wordAnalysisService.update(
          { _id: res._id },
          {
            characterCountDay: res.characterCountDay + result.length || 0,
            characterCountMonth: res.characterCountMonth + result.length || 0,
          },
        );
      }

      return Results.success(result || '');
    } catch (error) {
      throw error;
    }
  }
  async deleteChat(meetingCode: string): Promise<Result<boolean>> {
    await this._meetingService.updateMeeting(
      { _id: new mongoose.Types.ObjectId(meetingCode) },
      { chatWithAIAssistant: '[]' },
    );

    return Results.success(true);
  }

  async speechToTextRealtime({
    languageCode,
    listUsers,
    meeting,
    setTranscript,
    stream,
    timeStartRecord,
  }: {
    languageCode: LANGUAGE_CODE;
    listUsers: string[];
    meeting: Meeting;
    setTranscript: (trans: Translation) => void;
    stream: internal.Transform;
    timeStartRecord: number;
  }) {
    const audioInputStreamTransform = new Writable({
      write(chunk, encoding, next) {
        if (newStream && lastAudioInput.length !== 0) {
          const chunkTime = streamingLimit / lastAudioInput.length;
          if (chunkTime !== 0) {
            if (bridgingOffset < 0) {
              bridgingOffset = 0;
            }
            if (bridgingOffset > finalRequestEndTime) {
              bridgingOffset = finalRequestEndTime;
            }
            const chunksFromMS = Math.floor(
              (finalRequestEndTime - bridgingOffset) / chunkTime,
            );
            bridgingOffset = Math.floor(
              (lastAudioInput.length - chunksFromMS) * chunkTime,
            );

            for (let i = chunksFromMS; i < lastAudioInput.length; i++) {
              recognizeStream.write(lastAudioInput[i]);
            }
          }
          newStream = false;
        }

        audioInput.push(chunk);

        if (recognizeStream) {
          recognizeStream.write(chunk);
        }

        next();
      },

      final() {
        if (recognizeStream) {
          recognizeStream.end();
        }
      },
    });
    const audioStream = new PassThrough();
    ffmpeg(stream)
      .noVideo()
      .audioFrequency(16000)
      .format('flac')
      .audioChannels(1)
      .on('error', (err) => console.error('FFmpeg error :', err))
      .pipe(audioStream);

    audioStream.pipe(audioInputStreamTransform);

    //init streaming
    const streamingLimit = 295000;
    const speechClient = new speech.SpeechClient();
    let audioInput = [];
    let lastAudioInput = [];
    let resultEndTime = 0;
    let isFinalEndTime = 0;
    let finalRequestEndTime = 0;
    let newStream = true;
    let bridgingOffset = 0;
    let randomIndexOfListUsers = 0;
    let newWords = true;
    let restartCounter = 0;
    let timeStartSpeechToText = null;
    let recognizeStream: any;
    let timeoutId: any;

    const request: google.cloud.speech.v1.IStreamingRecognitionConfig = {
      config: {
        sampleRateHertz: 16000,
        languageCode: languageCode,
        encoding: 'FLAC',
        enableWordConfidence: true,
        enableWordTimeOffsets: true,
        audioChannelCount: 1,
      },
      interimResults: true,
    };

    //handle streaming
    const handleTranscript = (response: any) => {
      if (response?.results[0].isFinal) {
        isFinalEndTime = resultEndTime;
      }
      if (response.results.length > 0) {
        if (response?.results?.[0]?.alternatives?.[0]?.confidence == 0) {
          if (
            response?.results?.[0]?.alternatives?.[0]?.transcript?.length > 0
          ) {
            if (!timeStartSpeechToText) {
              timeStartSpeechToText = Date.now() - timeStartRecord;
            }
            if (newWords) {
              resultEndTime =
                response.results[0].resultEndTime.seconds * 1000 +
                Math.round(response.results[0].resultEndTime.nanos / 1000000);
              //ramdom index
              randomIndexOfListUsers = Math.floor(
                Math.random() * listUsers?.length,
              );
            }
            this._eventGateway.handlePingTranscript(
              {
                speaker: listUsers?.[randomIndexOfListUsers] || ' - ',
                time: timeStartSpeechToText,
                transcript:
                  response?.results?.[0]?.alternatives?.[0]?.transcript?.toString(),
                newWords,
              },
              meeting.id,
            );
            if (newWords) {
              newWords = false;
            }
          }
        } else {
          if (
            response?.results?.[0]?.alternatives?.[0]?.transcript?.length > 0
          ) {
            resultEndTime =
              response.results[0].resultEndTime.seconds * 1000 +
              Math.round(response.results[0].resultEndTime.nanos / 1000000);
            const contentTranscript: Translation = {
              meeting: meeting._id as any,
              speaker: listUsers?.[randomIndexOfListUsers] || ' - ',
              time: timeStartSpeechToText,
              transcript:
                response?.results?.[0]?.alternatives?.[0]?.transcript?.toString(),
              newWords,
              start: timeStartSpeechToText,
              end: Date.now() - timeStartRecord,
            };
            this._eventGateway.handlePingTranscript(
              contentTranscript,
              meeting.id,
            );

            setTranscript(contentTranscript);
            newWords = true;
            timeStartSpeechToText = null;
          }
        }
      }
    };

    const startStream = () => {
      audioInput = [];
      recognizeStream = speechClient
        .streamingRecognize(request)
        .on('error', (err: any) => {
          // console.log('failed to speech to text streaming', err);
          if (err.code === 11) {
            // restartStream();
          } else {
            console.error('API request error ' + err);
          }
        })
        .on('data', handleTranscript);

      timeoutId = setTimeout(restartStream, streamingLimit);
    };

    const restartStream = () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream.removeListener('data', handleTranscript);
        recognizeStream = null;
      }
      if (resultEndTime > 0) {
        finalRequestEndTime = isFinalEndTime;
      }
      resultEndTime = 0;
      lastAudioInput = [];
      lastAudioInput = audioInput;
      restartCounter++;
      newStream = true;
      startStream();
    };

    startStream();

    return () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream.removeAllListeners();
        recognizeStream = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }
}
