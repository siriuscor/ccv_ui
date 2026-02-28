const path = require('path');
const exec = require('child_process').execFile;
const dwebp_bin=function() {
    if (process.platform === 'darwin') {
        return path.join(__dirname, "/bin/dwebp_osx");//return osx library path
    }else if (process.platform === 'linux') {
        return path.join(__dirname, "/bin/dwebp_linux");//return linux library path
    }else if (process.platform === 'win32') {
        if (process.arch === 'x64') {
            return path.join(__dirname, "\\bin\\dwebp_win.exe");//return windows 64bit library path
        } else {
            console.log('Unsupported platform:', process.platform, process.arch);//show unsupported platform message
        }
    } else {
        console.log('Unsupported platform:', process.platform, process.arch);//show unsupported platform message 
    }
};

module.exports = (input_image,output_image,option,logging='-quiet') => {
return new Promise((resolve, reject) => {
  exec(`"${dwebp_bin()}"`,[`"${input_image}"`, ...option.split(/\s+/), `"${output_image}"`, `"${logging}"`],{ shell: true }, (error, stdout, stderr) => {
  if (error) {
   console.warn(error);
   return reject(error);
  }
  resolve(stdout? stdout : stderr);
 });
});
};

