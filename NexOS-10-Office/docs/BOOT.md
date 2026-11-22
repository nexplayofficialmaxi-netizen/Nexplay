# UEFI boot design

`config/auto/config` selects `iso-hybrid` and `grub-efi` for amd64. live-build packages the kernel/initramfs and live root filesystem. The custom menu at `config/bootloaders/grub-efi/grub.cfg` offers a normal live boot and a verbose troubleshooting boot. Both load `/live/vmlinuz` and `/live/initrd.img` with `boot=live`.

The first release target is UEFI x86-64 only. Secure Boot signing and BIOS/CSM support are not enabled or claimed. A successful build alone does not prove that the EFI loader boots: inspect El Torito metadata with `scripts/verify-image.sh ISO`, then boot the actual output through OVMF using `scripts/run-vm.sh ISO`. Record VM result and hardware details in `TESTING.md` only after running the tests.
