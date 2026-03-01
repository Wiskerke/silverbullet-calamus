{
  description = "SilverNotes Calamus - SilverBullet plug for Supernote .note files";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            just
            uv
            nix-ld
            python3
          ];

          shellHook = ''
            echo "silverbullet-calamus dev environment loaded"
            echo "  Node: $(node --version)"
          '';
        };
      }
    );
}
