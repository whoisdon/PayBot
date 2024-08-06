import { exec } from 'child_process';

exec('neofetch --ascii_distro artix', (_, stdout) => {
 console.log(stdout);
});
