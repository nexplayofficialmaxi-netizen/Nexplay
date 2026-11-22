#!/usr/bin/env bash
# Validate tracked source layout and shell syntax without building or pretending to make an ISO.
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for required in \
  config/auto/config config/auto/build config/auto/clean \
  config/package-lists/nexos.list.chroot \
  config/bootloaders/grub-efi/grub.cfg \
  config/includes.chroot/usr/share/xsessions/nexos.desktop \
  desktop/README.md branding/README.md docs/ARCHITECTURE.md docs/BOOT.md docs/TESTING.md \
  scripts/build-live.sh scripts/verify-image.sh scripts/run-vm.sh; do
  [[ -s "$required" ]] || { echo "ERROR: archivo requerido ausente/vacío: $required" >&2; exit 1; }
done

for script in config/auto/*.sh config/auto/config config/auto/build config/auto/clean scripts/*.sh; do
  [[ -f "$script" ]] && bash -n "$script"
done

echo 'OK: estructura requerida y sintaxis shell.'
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck config/auto/config config/auto/build config/auto/clean scripts/*.sh
  echo 'OK: ShellCheck.'
else
  echo 'AVISO: ShellCheck no está disponible; comprobación omitida.'
fi
if command -v lb >/dev/null 2>&1; then
  echo "live-build disponible: $(lb --version | head -n 1)"
else
  echo 'AVISO: live-build no está instalado; no se puede validar configuración con la herramienta.'
fi
echo 'No se compiló ni inspeccionó una ISO con este validador.'
