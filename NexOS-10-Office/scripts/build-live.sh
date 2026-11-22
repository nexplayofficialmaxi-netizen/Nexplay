#!/usr/bin/env bash
# Configure and build a genuine Debian Live ISO; never manufacture a placeholder image.
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: live-build necesita permisos de root. Ejecuta: sudo $0" >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo 'ERROR: no se pudo identificar el sistema de construcción.' >&2
  exit 1
fi
# shellcheck disable=SC1091
. /etc/os-release
if [[ "${ID:-}" != debian || "${VERSION_ID:-}" != 13 ]]; then
  echo "ERROR: el constructor esperado es Debian 13; detectado ${PRETTY_NAME:-desconocido}." >&2
  exit 1
fi

for tool in lb debootstrap xorriso; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "ERROR: falta '$tool'. Instala live-build, debootstrap y xorriso." >&2
    exit 1
  fi
done

if [[ ! -x config/auto/config ]]; then
  echo 'ERROR: falta config/auto/config o no es ejecutable.' >&2
  exit 1
fi

# Do not clean prior output implicitly. live-build will report if its existing
# state cannot be reused; the developer may then explicitly run `lb clean`.
echo 'Configurando NexOS 10 Office (Debian 13 / amd64 / GRUB EFI)...'
./config/auto/config
echo 'Construyendo ISO con live-build. Esto puede tardar y requiere Internet...'
./config/auto/build

ISO="$ROOT_DIR/binary.hybrid.iso"
if [[ ! -s "$ISO" ]]; then
  echo "ERROR: live-build terminó pero no produjo la ISO esperada: $ISO" >&2
  exit 1
fi
printf 'ISO creada por live-build: %s\n' "$ISO"
sha256sum "$ISO"
echo 'La ISO se creó; todavía debe verificarse y probarse en UEFI/QEMU.'
