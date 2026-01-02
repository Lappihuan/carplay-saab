{ pkgs ? import <nixpkgs> {} }:

(pkgs.buildFHSEnv {
  name = "electron-env";

  # everything you need at runtime AND to compile native modules:
  targetPkgs = p: [
    p.libxcrypt-legacy
    p.zlib
    p.binutils
  ];


#    p.binutils         # provides `as`
#    p.gcc               # provides `g++`
#    p.gnumake           # provides `make`
#    p.pkg-config        # provides pkg-config
#    p.python3           # provides python for node-gyp

#    p.portaudio

#    p.systemd           # libudev runtime
#    p.systemd.dev       # <-- provides libudev.h
#    p.libusb1
#    p.libusb1.dev
#    p.fuse

#    p.libcxx
#    p.systemd
#    p.libpulseaudio
#    p.libdrm
#    p.mesa
#    p.libgbm
#    p.libGL
#    p.vulkan-loader
#    p.alsa-lib
#    p.atk
#    p.at-spi2-atk
#    p.at-spi2-core
#    p.cairo
#    p.cups
#    p.dbus
#    p.expat
#    p.fontconfig
#    p.freetype
#    p.gdk-pixbuf
#    p.glib
#    p.gtk3
#    p.libnotify
#    p.libuuid
#    p.nspr
#    p.nss
#    p.pango
#    p.libappindicator-gtk3
#    p.libdbusmenu
#    p.libxkbcommon
#    p.zlib
#  ] ++ (with p.xorg; [
#    libXScrnSaver
#    libXrender
#    libXcursor
#    libXdamage
#    libXext
#    libXfixes
#    libXi
#    libXrandr
#    libX11
#    libXcomposite
#    libxshmfence
#    libXtst
#    libxcb
#  ]);

  # start you in bash
  runScript = "bash";
}).env