# tmux-gpu

A tmux nVIDIA gpu monitor.
Inspired from [rainbarf](https://github.com/creaktive/rainbarf).

![tmux-gpu](https://github.com/alexge233/tmux-gpu/blob/master/tmux-gpu.png?raw=true)

The script will obtain and display:
- `GPU usage` left, green bars.
- `Memory utilization` second from left, cyan bars.
- `Power level` third from left, red bar.
- `RAM usage` fourth from left, organge bars.

## Dependencies

- `nvidia-smi` check how your distro packages it, or use nVidia's binaries.
- `Node.js` installed and configured
    - `sudo apt install nodejs npm`
    - `npm install tmux-colors`

## Install

Download the script in your `.tmux/` directory:

```
mkdir .tmux/
wget https://raw.githubusercontent.com/yatli/tmux-gpu/master/gpu.js ~/.tmux/gpu.js
```

Sample `.tmux.conf` setting:
```
set -g status-right "#[bg=white] #(nodejs ~/.tmux/tmux-gpu/gpu.js)"
```


The script uses *unicode* boxes to plot the graph, thus make sure your terminal supports them.
Feel free to hack into it.
I have not tested it under OSX, only linux.

G
