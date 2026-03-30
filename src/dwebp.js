const path = require('path');
const exec = require('child_process').execFile;
const dwebp_bin=function() {
    let binPath = '';
    if (process.platform === 'darwin') {
        binPath = path.join(__dirname, "/bin/dwebp_osx");//return osx library path
    }else if (process.platform === 'linux') {
        binPath = path.join(__dirname, "/bin/dwebp_linux");//return linux library path
    }else if (process.platform === 'win32') {
        if (process.arch === 'x64') {
            binPath = path.join(__dirname, "\\bin\\dwebp_win.exe");//return windows 64bit library path
        } else {
            console.log('Unsupported platform:', process.platform, process.arch);//show unsupported platform message
        }
    } else {
        console.log('Unsupported platform:', process.platform, process.arch);//show unsupported platform message 
    }
    return binPath ? binPath.replace('app.asar', 'app.asar.unpacked') : binPath;
};

module.exports = (input_image,output_image,option,logging='-quiet') => {
return new Promise((resolve, reject) => {
  exec(dwebp_bin(), [input_image, ...option.split(/\s+/), output_image, logging], { shell: false }, (error, stdout, stderr) => {
  if (error) {
   console.warn(error);
   return reject(error);
  }
  resolve(stdout? stdout : stderr);
 });
});
};

