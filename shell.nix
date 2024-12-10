{ 
  nixpkgs ? fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-24.05",
  pkgs ? import nixpkgs { config = {}; overlays = []; }
}:

pkgs.mkShellNoCC {
  packages = with pkgs; [
    cowsay

    bun
    nodePackages.typescript
    nodePackages.typescript-language-server
    nodePackages.prettier

    emmet-ls
    nodePackages.pyright
    
    python3
    python3Packages.pip
    python3Packages.virtualenv
  ];

  # Hook to install requirements when entering the shell
  shellHook = ''
    # Create a Python virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
      echo "Creating Python virtual environment..."
      python3 -m venv .venv
    fi

    source .venv/bin/activate

    if [ -f "requirements.txt" ]; then
      echo "Installing Python requirements..."
      pip install -r requirements.txt
    else
      echo "No requirements.txt found. Skipping dependency installation."
    fi

    echo "Development environment is ready!"
    cowsay "Nix Shell Activated!"
  '';
}

