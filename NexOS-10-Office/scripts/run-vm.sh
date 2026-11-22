#!/usr/bin/env bash
# Boot a supplied ISO in an isolated QEMU VM using OVMF (UEFI).
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 /ruta/a/una-ISO-real.iso" >&2
  exit 2
fi
ISO="$(realpath -- "$1")"
[[ -s "$ISO" ]] || { echo "ERROR: ISO inexistente o vacía: $ISO" >&2; exit 1; }
command -v qemu-system-x86_64 >/dev/null 2>&1 || { echo 'ERROR: qemu-system-x86_64 no está instalado.' >&2; exit 1; }

CODE="${OVMF_CODE:-}"
VARS_TEMPLATE="${OVMF_VARS:-}"
for pair in \
  '/usr/share/OVMF/OVMF_CODE.fd:/usr/share/OVMF/OVMF_VARS.fd' \
  '/usr/share/ovmf/OVMF.fd:/usr/share/ovmf/OVMF_VARS.fd' \
  '/usr/share/edk2/ovmf/OVMF_CODE.fd:/usr/share/edk2/ovmf/OVMF_VARS.fd'; do
  if [[ -z "$CODE" && -r "${pair%%:*}" ]]; then CODE="${pair%%:*}"; VARS_TEMPLATE="${pair#*:}"; fi
done
[[ -r "$CODE" ]] || { echo 'ERROR: no se encontró OVMF_CODE. Define OVMF_CODE=/ruta/OVMF_CODE.fd.' >&2; exit 1; }
[[ -r "$VARS_TEMPLATE" ]] || { echo 'ERROR: no se encontró OVMF_VARS. Define OVMF_VARS=/ruta/OVMF_VARS.fd.' >&2; exit 1; }

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
cp -- "$VARS_TEMPLATE" "$TMP_DIR/OVMF_VARS.fd"

QEMU=(qemu-system-x86_64 -machine q35 -m 2048 -smp 2 \
  -drive "if=pflash,format=raw,readonly=on,file=$CODE" \
  -drive "if=pflash,format=raw,file=$TMP_DIR/OVMF_VARS.fd" \
  -cdrom "$ISO" -boot order=d -nic user,model=virtio-net-pci -display gtk)
if [[ -e /dev/kvm ]]; then QEMU+=(-enable-kvm); fi
exec "${QEMU[@]}"
