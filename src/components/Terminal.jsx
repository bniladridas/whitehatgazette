import { useState, useEffect, useRef } from 'react';
import Modal from './Modal'; 
import AudioPlayer from './AudioPlayer'; 
import VideoPlayer from './VideoPlayer';
import fileSystem from '../utils/fileSystem';

const Terminal = () => {
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dirHistory, setDirHistory] = useState([{ path: ' ~' }]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const outputRef = useRef(null);

  const currentDir = dirHistory[dirHistory.length - 1].path;

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const resolvePath = (dir, relativePath) => {
    if (relativePath === '..') {
      return dir.split('/').slice(0, -1).join('/') || '/';
    }
    if (relativePath.startsWith('/')) {
      return relativePath;
    }
    return `${dir}/${relativePath}`.replace(/\/+/g, '/');
  };

  const handleCommand = (command) => {
    let notInHistory;
    const trimmedCommand = command.trim();
    const [baseCommand, ...args] = trimmedCommand.split(' ');
    let response = '';

    switch (baseCommand) {
      case 'ls': {
        const dirContent = fileSystem[currentDir] || [];
        response = (
          <div>
            {dirContent.map((item) => {
              const fullPath = `${currentDir}/${item}`;
              const isDirectory = Array.isArray(fileSystem[fullPath]);
              return (
                <span
                  key={item} // Using the item as key, assuming it's unique
                  className={isDirectory ? 'text-blue-600 ml-2' : 'text-white ml-2'}
                >
                  {item}{' '}
                </span>
              );
            })}
          </div>
        );
        break;
      }
      case 'pwd':
        response = currentDir.replace('~', '/homeUser');
        break;
      case 'date':
        response = new Date().toString();
        break;
      case 'help':
        response = `
          Available Commands:
          -------------------
          - ls            : List directory contents
          - pwd           : Print working directory
          - date          : Show current date and time
          - help          : Display this help message
          - clear         : Clear the terminal screen
          - cd            : Change directory
          - cat           : Display file content
          - history       : Show command history

          Aliases:
          --------
          - open-image    : Open an image file
          - play-audio    : Play an audio file
          - play-video    : Play a video file
        `;
        break;
      case 'echo':
        const environmentVariables = {
          $PATH: '/astro:/react:/tailwind:/postcss:/npm:/javascript',
          $AUTH: 'NILADRI DAS',
          $HOME: 'https://github.com/bniladridas/whitehatgazette',
          $NOW: new Date().toLocaleString(),
          $RANDOM: Math.floor(Math.random() * 1000).toString(),
        };
        response = args
          .join(' ')
          .replace(/["']/g, '')
          .replace(/\$(\w+)/g, (match, varName) => environmentVariables[`$${varName}`] || match);
        break;
      case 'history':
        response = commandHistory
          .map((command, index) => `${index + 1}  ${command}`)
          .join('\n');
        break;
      case 'clear':
        setCommandHistory((prevHistory) => [...prevHistory, trimmedCommand]);
        setOutput([]);
        setInput('');
        return;
      case 'cd': {
        const newDir = args.join(' ').trim();
        const targetPath = resolvePath(currentDir, newDir);

        if (newDir === '' || newDir === '/') {
          setDirHistory((prevHistory) => [...prevHistory, { path: ' ~' }]);
        } else if (fileSystem[targetPath] && Array.isArray(fileSystem[targetPath])) {
          setDirHistory((prevHistory) => [...prevHistory, { path: targetPath }]);
        } else {
          response = `bash: cd: ${newDir}: No such directory`;
        }
        break;
      }
      case 'cat': {
        const fileName = args.join(' ').trim();
        const filePath = resolvePath(currentDir, fileName);

        if (fileSystem[filePath] && typeof fileSystem[filePath] === 'string') {
          response = fileSystem[filePath];
        } else {
          response = `bash: cat: ${fileName}: No such file`;
        }
        break;
      }
      case 'rm': {
        const whatAreYouDoing = args[0] + args[1];
        if (whatAreYouDoing === '-rf/') {
          response = 'bash: Your computer will be destroyed... just kidding! 😂';
          response += ' ¿What are you doing?';
        } else {
          response = 'bash: You dont have permission to delete anything.';
        }
        break;
      }
      case 'open-image': {
        const imageName = args.join(' ').trim();
        const imagePath = resolvePath(currentDir, imageName);
        if (fileSystem[imagePath] && typeof fileSystem[imagePath] === 'string') {
          setImageSrc(fileSystem[imagePath]);
          setModalOpen(true);
          response = `Opening image: ${imageName}`;
        } else {
          response = `bash: open-image: ${imageName}: No such file`;
        }
        break;
      }
      case 'play-audio': {
        const audioFile = args.join(' ').trim();
        const audioPath = resolvePath(currentDir, audioFile);
        if (fileSystem[audioPath] && typeof fileSystem[audioPath] === 'string') {
          setAudioSrc(fileSystem[audioPath]);
          setPlayerOpen(true);
          response = `Playing audio: ${audioFile}`;
        } else {
          response = `bash: play-audio: ${audioFile}: No such file`;
        }
        break;
      }
      case 'play-video': {
        const videoFile = args.join(' ').trim();
        const videoPath = resolvePath(currentDir, videoFile);
        if (fileSystem[videoPath] && typeof fileSystem[videoPath] === 'string') {
          setVideoSrc(fileSystem[videoPath]);
          setVideoOpen(true);
          response = `Playing video: ${videoFile}`;
        } else {
          response = `bash: play-video: ${videoFile}: No such file`;
        }
        break;
      }
      case 'man':
        response = 'bash: try command "help" for commands availables';
        break;
      case '':
        notInHistory = true;
        break;
      default:
        response = `bash: ${baseCommand}: command not found`;
    }

    setOutput((prevOutput) => [
      ...prevOutput,
      { command: trimmedCommand, response, dir: currentDir },
    ]);
    setInput('');

    if (notInHistory) return;
    if (response !== `bash: ${baseCommand}: command not found`) {
      setCommandHistory((prevHistory) => [...prevHistory, trimmedCommand]);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setImageSrc('');
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setAudioSrc('');
  };

  const closeVideoPlayer = () => {
    setVideoOpen(false);
    setVideoSrc('');
  };

  return (
    <div className="h-screen w-full bg-black text-white p-4 flex flex-col flex-start"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#38112e #38112e',
      }}>
      <div className="output overflow-y-auto whitespace-pre-wrap break-words sm:text-2xl mb-4" ref={outputRef}>
        {output.map((entry, index) => (
          <div className="mb-2" key={index}>
            <div>
              <span className="text-green-500">vampire@whitehatgazette:</span>
              <span className="text-blue-600 font-semibold">{entry.dir}</span>
              <span className="text-white">$ {entry.command}</span>
            </div>
            {entry.response && (
              <div className="text-white mb-2">{entry.response}</div>
            )}
          </div>
        ))}
      </div>

      {modalOpen && <Modal src={imageSrc} closeModal={closeModal} />}
      {playerOpen && <AudioPlayer audioSrc={audioSrc} closePlayer={closePlayer} />}
      {videoOpen && <VideoPlayer videoSrc={videoSrc} closeVideoPlayer={closeVideoPlayer} />}

      <div className="mt-4">
        <input
          className="bg-black text-white p-2 w-full border border-gray-600"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCommand(input);
            } else if (e.key === 'ArrowUp') {
              if (historyIndex < commandHistory.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setInput(commandHistory[commandHistory.length - 1 - historyIndex]);
              }
            } else if (e.key === 'ArrowDown') {
              if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setInput(commandHistory[commandHistory.length - 1 - historyIndex]);
              } else {
                setHistoryIndex(-1);
                setInput('');
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Terminal;
