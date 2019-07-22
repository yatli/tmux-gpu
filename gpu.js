///
/// Node.js script which gets the nvidia GPU usage, free memory and temp
/// and displays it as in your tmux status bar.
///
const sp     = require('child_process');
const os     = require('os');
const fs     = require('fs');
const colors = require('tmux-colors');
const path   = require('path');

// width of GPU usage
const gpu_width = 5;
const pci_width = 3;
const pwr_width = 2;
const ram_width = 3;

const filename = path.join(os.homedir(), '.gpu.tmp');

// get the nvidia gpu ids installed
var gpus = sp.spawnSync("nvidia-smi", ["--query-gpu=utilization.memory,utilization.gpu,power.draw,power.limit,memory.total,memory.used", "--format=csv,noheader,nounits"]);
var output = gpus.stdout.toString();
//console.log(output)
var lines = output.split("\n");

var samples = new Array(lines.length);
var devices = 0;

// for each gpu installed we'll query usage, temp and memory usage
lines.forEach(function(str){
    // [0] = ram util, [1] gpu util, [2] pwr draw, [3] pwr limit, [4] mem total [5] mem used
    var values = str.split(",");
    if(values.length != 6) return

    samples[devices] = [0,0,0,0]

    samples[devices][0] = parseFloat(values[1]);
    samples[devices][1] = parseFloat(values[0]);
    samples[devices][2] = parseFloat(values[2]) / parseFloat(values[3]) * 100;
    samples[devices][3] = parseFloat(values[5]) / parseFloat(values[4]) * 100;

    devices++;
});

// 8ths 
var bars = [ '\u2581','\u2582','\u2583','\u2584',
             '\u2585','\u2586','\u2587','\u2588','\u2588'];

// all previous history
var history_records = [];
for(var i=0;i<devices;++i)
{
    history_records[i] = {}
}
var contents;
// load previous samples from file
fs.access(filename, fs.F_OK, function(err) {
    if (!err) {
        if (contents = fs.readFileSync(filename, 'utf8')){
            history_records = JSON.parse(contents);
            for(var i=0;i<devices;++i)
            {
                print_graphs(i);
            }
            // write computed samples to file
            fs.writeFile(filename, JSON.stringify(history_records), function (err){
                if (err){ console.error('cannot write tmp file');}
            });
        }
    } 
    else {
        for(var d=0;d<devices;++d)
        {
            history = []
            history[0] = [];
            history[1] = [];
            history[2] = [];
            history[3] = [];
            for (var i=0; i<gpu_width; i++)
                history[0][i] = parseFloat(0);
            for (var i=0; i<pci_width; i++)
                history[1][i] = parseFloat(0);
            for (var i=0; i<pwr_width; i++)
                history[2][i] = parseFloat(0);
            for (var i=0; i<ram_width; i++)
                history[3][i] = parseFloat(0);
            history_records[d] = history;
            print_graphs(d);
        }

        // write computed samples to file
        fs.writeFile(filename, JSON.stringify(history_records), function (err){
            if (err){ console.error('cannot write tmp file');}
        });
        //
    }
});

function print_graphs(gpu_id)
{
    var text = ['','','',''];
    history = history_records[gpu_id]
    s = samples[gpu_id]

    //console.log(samples)
    //console.log(history)
    for (var i=0; i<history.length; i++){
        history[i].shift();
        history[i].push(s[i]);
        for (var k=0; k<history[i].length; k++){
            var x = parseInt((((history[i][k] - 0) * (8 - 1)) / (100 - 0)) + 1);
            text[i] += bars[x];
        }
    }

    process.stdout.write(" #[fg=red,bold,bg=white]GPU" + gpu_id +" " + s[0].toFixed() + "% "+s[1].toFixed() + "% ")
    process.stdout.write(colors('#[fg=green,bold]'+text[0]+'#[fg=cyan,bold]'+text[1]
                         +'#[fg=red,bold]'+text[2]+'#[fg=yellow,bold]'+text[3]
    ));
                         //+'#[default]'));
}

//console.log(samples);
