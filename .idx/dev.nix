{ pkgs, ... }: {
  packages = [
    pkgs.yarn
    pkgs.xvfb-run
    pkgs.libglibutil
    pkgs.sudo
    pkgs.ffmpeg
    pkgs.libgudev
    pkgs.systemd
    pkgs.xorg.xorgserver
  ];
  
}
