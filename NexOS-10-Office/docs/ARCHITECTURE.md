# Architecture — initial stage

## Goal

Build NexOS 10 Office as a NexPlay-branded Debian 13 live distribution, then progressively integrate the NexOS desktop shell and a tested installation path. Linux kernel and Debian's maintained drivers are used rather than implementing a new kernel.

## Initial choices

- Base: Debian 13 (trixie), amd64, package repositories `main`, `contrib`, `non-free-firmware`.
- Kernel and hardware support: Debian `linux-image-amd64` and Debian firmware packages. No custom kernel or out-of-tree driver is introduced in this stage.
- Display/session: Xorg, LightDM, Openbox, PCManFM and LXTerminal.
- Boot: hybrid live ISO with GRUB EFI. BIOS/legacy boot is not configured or claimed.
- Live filesystem: standard live-build squashfs/live-boot flow.
- Main NexPlay web project: stays at repository root; no root application, Vite configuration, dependencies, services, or assets are changed by this addition.
- NexOS desktop: planned boundary under `desktop/`; not yet implemented or included as an application.

## Current limitations

This is a live-image bootstrap configuration, not a new kernel, installer, upgrade service, or completed desktop OS. `--debian-installer false` is intentional for the first bootable test image; an installer will be a later separately tested stage. The RAM target (~500 MB idle) is not guaranteed and must be measured after the GUI shell is integrated. Firmware availability and hardware compatibility vary; keep security updates enabled.
