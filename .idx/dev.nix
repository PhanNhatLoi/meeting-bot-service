{ pkgs, ... }:

{
  packages = [
    # ===== Existing packages (giữ nguyên) =====
    pkgs.yarn
    pkgs.xvfb-run
    pkgs.libglibutil
    pkgs.sudo
    pkgs.ffmpeg
    pkgs.libgudev
    pkgs.systemd
    pkgs.xorg.xorgserver

    # ===== Node =====
    pkgs.nodejs_20

    # ===== Chromium chuẩn nix =====
    pkgs.chromium
    pkgs.libxkbcommon

    # ===== Fix libxcb + X11 deps =====
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.dbus
    pkgs.at-spi2-atk
    pkgs.gtk3
    pkgs.pango
    pkgs.cairo
    pkgs.expat
    pkgs.libdrm
    pkgs.mesa
    pkgs.alsa-lib
    pkgs.cups

    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXcursor
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXi
    pkgs.xorg.libXrandr
    pkgs.xorg.libXScrnSaver
    pkgs.xorg.libXtst
    pkgs.xorg.libxcb
  ];

  env = {
    NODE_ENV = "development";

    # Quan trọng nhất
    CHROME_BIN = "${pkgs.chromium}/bin/chromium";
    PUPPETEER_SKIP_DOWNLOAD = "true";
  };
}