#!/usr/bin/node
///
/// Node.js script which gets the nvidia GPU usage, free memory and temp
/// and displays it as in your tmux status bar.
///
const sp = require('child_process');

// width of GPU usage
const gpu_width = 5;
const pci_width = 3;
const pwr_width = 2;
const ram_width = 3;

// get the nvidia gpu ids installed
var gpus = sp.spawnSync("nvidia-smi", ["--query-gpu=utilization.memory,utilization.gpu,power.draw,power.limit,memory.total,memory.used", "--format=csv,noheader,nounits"]);
var output = gpus.stdout.toString();
var lines = output.split("\n");

var averages = [0, 0, 0, 0];
var devices = 0;

// for each gpu installed we'll query usage, temp and memory usage
lines.forEach(function(str){
    // [0] = ram util, [1] gpu util, [2] pwr draw, [3] pwr limit, [4] mem total [5] mem used
    var values = str.split(",");
    if(values.length != 6) return

    averages[0] += parseFloat(values[1]);
    averages[1] += parseFloat(values[0]);
    averages[2] += parseFloat(values[2]) / parseFloat(values[3]);
    averages[3] += parseFloat(values[5]) / parseFloat(values[4]);

    devices++;
});

// Average all values
for (var i=0; i< averages.length; i++){
    averages[i] = averages[i]/devices;
}

// 8ths 
var bars = [ '\u2581','\u2582','\u2583','\u2584',
             '\u2585','\u2586','\u2587','\u2588'];

// all previous history
var history = {};
const fs = require('fs');
var contents;

// load previous averages from file
fs.access('.gpu.tmp', fs.F_OK, function(err) {
    if (!err) {
        if (contents = fs.readFileSync('.gpu.tmp', 'utf8')){
            history = JSON.parse(contents);
            print_graphs();
        }
    } 
    else {
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
        //
        print_graphs();
    }
});

function print_graphs()
{
    var text = ['','','',''];
    for (var i=0; i<averages.length; i++){
        history[i].shift();
        history[i].push(averages[i]);
        for (var k=0; k<history[i].length; k++){
            var x = parseInt((((history[i][k] - 0) * (8 - 1)) / (100 - 0)) + 1);
            text[i] += bars[x];
        }
    }

    var colors = require('tmux-colors');
    process.stdout.write("GPU " + averages[1].toFixed() + "% "+averages[0].toFixed() + "% ")
    process.stdout.write(colors('#[fg=green,bold]'+text[0]+'#[fg=cyan,bold]'+text[1]
                         +'#[fg=red,bold]'+text[2]+'#[fg=yellow,bold]'+text[3]
                         +'#[default]'));

    // write computed averages to file
    fs.writeFile('.gpu.tmp', JSON.stringify(history), function (err){
        if (err){ console.error('cannot write tmp file');}
    });
}

//console.log(averages);
