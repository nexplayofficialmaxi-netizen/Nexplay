#!/usr/bin/env bash
# Check source/configuration and, if supplied, inspect a real ISO.
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required=(
  config/auto/config
  config/auto/build
  config/auto/clean
  config/package-lists/nexos.list.chroot
  config/bootloaders/grub-efi/grub.cfg
  config/includes.chroot/usr/share/xsessions/nexos.desktop
  docs/ARCHITECTURE.md
  docs/BOOT.md
  scripts/build-live.sh
  scripts/run-vm.sh
)
for path in "${required[@]}"; do
  [[ -s "$path" ]] || { echo "ERROR: archivo ausente o vacío: $path" >&2; exit 1; }
done

for script in config/auto/config config/auto/build config/auto/clean scripts/*.sh; do
  bash -n "$script"
done

echo 'OK: estructura requerida y sintaxis Bash comprobadas.'
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck config/auto/config config/auto/build config/auto/clean scripts/*.sh
  echo 'OK: ShellCheck.'
else
  echo 'AVISO: ShellCheck no está instalado; se omitió esa comprobación.'
fi

if [[ $# -eq 0 ]]; then
  echo 'Sin ISO proporcionada: solo se comprobó la estructura. No se validó ni se creó una imagen.'
  exit 0
fi

ISO="$1"
[[ -f "$ISO" && -s "$ISO" ]] || { echo "ERROR: ISO inexistente o vacía: $ISO" >&2; exit 1; }
command -v xorriso >/dev/null 2>&1 || { echo 'ERROR: instala xorriso para inspeccionar la ISO.' >&2; exit 1; }

REPORT="$(xorriso -indev "$ISO" -report_el_torito plain 2>&1)" || {
  printf '%s\n' "$REPORT" >&2
  exit 1
}
printf '%s\n' "$REPORT"
if ! printf '%s\n' "$REPORT" | grep -Eiq 'UEFI|platform.*0xef|EFI'; then
  echo 'ERROR: el informe El Torito no confirma una entrada EFI; no se declara UEFI verificado.' >&2
  exit 1
fi
sha256sum "$ISO"
echo 'OK: ISO existente, legible por xorriso y con indicador EFI en su informe El Torito.'
