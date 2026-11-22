# Test record

## Repository change review

- Target directory is `NexOS-10-Office/` only.
- Parent NexPlay React/Vite app files are not included in the change set.
- The current `main` branch does not contain a separate NexOS web desktop folder. No app is copied or replaced.
- No ISO is checked in or represented as built.

## Checks available to run on Debian 13

```sh
./scripts/validate-config.sh
sudo ./scripts/build-live.sh
./scripts/verify-image.sh ./binary.hybrid.iso
./scripts/run-vm.sh ./binary.hybrid.iso
```

Expected evidence for a successful initial image: live-build exits successfully and creates a non-empty `binary.hybrid.iso`; xorriso reports an EFI El Torito entry; the ISO reaches a usable LightDM/Openbox session in OVMF; keyboard and mouse work. Record exact commands, software versions, checksums, and pass/fail results below.

## Results

Not run in the GitHub file-writing environment: live-build, ShellCheck, ISO creation, xorriso image inspection, and QEMU/OVMF boot. Therefore there is no verified ISO yet and no claim that boot testing succeeded.

| Check | Result | Notes |
|---|---|---|
| Static config and shell syntax | Pending Debian 13 execution | Run `scripts/validate-config.sh` |
| live-build ISO generation | Not run | No ISO produced by this change |
| EFI El Torito inspection | Not run | Requires a real ISO |
| QEMU/OVMF boot | Not run | Requires a real ISO and OVMF |
| Main React/Vite build | Not run here | Parent project files were not changed |
| RAM / hardware compatibility | Not measured | Requires booted image on declared test hardware |
