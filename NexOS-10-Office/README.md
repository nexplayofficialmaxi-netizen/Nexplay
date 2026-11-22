# NexOS 10 Office — Debian Live

Configuración inicial, aislada, para desarrollar una distribución live de NexPlay basada en Debian 13 (trixie), amd64, con arranque UEFI mediante GRUB y escritorio ligero Openbox/Xorg.

> **Estado:** estructura y configuración inicial. Esta carpeta todavía no contiene una ISO compilada ni un instalador de disco. No se debe presentar como sistema terminado.

## Conservación del proyecto NexPlay

Todo lo relacionado con el sistema vive bajo `NexOS-10-Office/`. No modifica el `package.json`, los fuentes React/Vite, los servicios ni la configuración del sitio principal. La interfaz NexOS se integrará en `desktop/` en una etapa posterior; no se copiará ni se arrancará automáticamente el sitio NexPlay como si fuera el escritorio NexOS.

## Requisitos para construir

- Equipo de construcción Debian 13 (trixie) amd64, con acceso a los repositorios Debian.
- Permisos de administrador (`root` o `sudo`).
- Conexión a Internet y espacio libre para los paquetes y artefactos de live-build.
- Para ejecutar la ISO en VM: QEMU x86-64, OVMF y al menos 2 GiB de RAM asignada a la VM.

Instala las herramientas de construcción en el equipo Debian:

```sh
sudo apt update
sudo apt install live-build debootstrap xorriso qemu-system-x86 ovmf shellcheck
```

## Uso

Desde la raíz del repositorio:

```sh
cd NexOS-10-Office
./scripts/validate-config.sh
sudo ./scripts/build-live.sh
./scripts/verify-image.sh ./binary.hybrid.iso
./scripts/run-vm.sh ./binary.hybrid.iso
```

La compilación usa `live-build` y descarga paquetes de Debian; puede tardar. No se genera una imagen ficticia ni se publica una ISO si la compilación falla. `build-live.sh` no borra automáticamente artefactos anteriores. Para limpiar solo los generados por live-build, ejecuta conscientemente `sudo lb clean` dentro de esta carpeta.

## Etapas / limitaciones actuales

1. Configuración de Debian 13 amd64, paquetes mínimos de escritorio y sesión Openbox.
2. ISO live híbrida preparada para GRUB UEFI.
3. Verificar config y scripts; compilar una imagen real.
4. Inspeccionar la entrada EFI de la ISO y probar arranque en QEMU/OVMF.
5. Integrar el shell gráfico NexOS conservando este prototipo y el sitio NexPlay intactos.
6. Evaluar instalador de disco, actualizaciones, soporte de hardware y consumo RAM en pruebas reales.

El objetivo de aproximadamente 500 MB de RAM es una meta experimental, no una garantía. En esta etapa no se han medido memoria, compatibilidad de hardware ni arranque real. La imagen live inicial no equivale todavía a un instalador permanente.

Consulta `docs/ARCHITECTURE.md`, `docs/BOOT.md`, `docs/TESTING.md` y `desktop/README.md`.
