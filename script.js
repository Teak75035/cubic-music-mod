// 音乐播放器功能实现

// DOM元素 - 延迟获取
let playBtn;
let progressBar;
let progressFilled;
let volumeBar;
let volumeFilled;
let favoriteBtn;
let searchInput;
let musicUpload;
let uploadArea;
let localTrackList;
let trackListEmpty;
let appContainer;
let menuBtn;
let playerInfo;
let playerImage;

// 播放状态
let isPlaying = false;
let currentTrack = 0;

// 本地歌曲列表
const tracks = [];

// 音频元素
let audioElement = null;
let audioContext = null;
let analyser = null;
let mediaSource = null;
let dataArray = null;
let animationId = null;
let currentAnimationDuration = 1.5;

// 音量控制
let currentVolume = 1.0; // 默认音量为100%

// 播放速度控制
let currentSpeed = 1.0; // 默认速度为1x
const speedOptions = [1.0, 1.25, 1.5, 2.0]; // 速度选项

// 初始化播放器
function initPlayer() {
    // 获取DOM元素
    playBtn = document.querySelector('.play-btn');
    progressBar = document.querySelector('.progress-bar');
    progressFilled = document.querySelector('.progress-filled');
    volumeBar = document.querySelector('.volume-bar');
    volumeFilled = document.querySelector('.volume-filled');
    favoriteBtn = document.querySelector('.favorite-btn');
    searchInput = document.querySelector('.search-input');
    musicUpload = document.getElementById('music-upload');
    uploadArea = document.querySelector('.upload-area');
    localTrackList = document.querySelector('.local-track-list');
    trackListEmpty = document.querySelector('.track-list-empty');
    appContainer = document.querySelector('.app-container');
    menuBtn = document.querySelector('.menu-btn');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    playerInfo = document.querySelector('.player-info');
    playerImage = document.querySelector('.player-image');
    
    // 加载保存的音量设置
    loadVolumeSettings();
    
    setupEventListeners();
}

// 加载音量设置
function loadVolumeSettings() {
    // 从localStorage获取保存的音量
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        currentVolume = parseFloat(savedVolume);
    }
    
    // 更新音量条显示
    if (volumeFilled) {
        volumeFilled.style.width = `${currentVolume * 100}%`;
    }
    
    // 如果有音频元素，设置其音量
    if (audioElement) {
        audioElement.volume = currentVolume;
    }
}

// 拖拽状态
let isDragging = false;
let isVolumeDragging = false;

// 设置事件监听器
function setupEventListeners() {
    // 重新获取DOM元素
    playBtn = document.querySelector('.play-btn');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    progressBar = document.querySelector('.progress-bar');
    progressFilled = document.querySelector('.progress-filled');
    volumeBar = document.querySelector('.volume-bar');
    volumeFilled = document.querySelector('.volume-filled');
    favoriteBtn = document.querySelector('.favorite-btn');
    searchInput = document.querySelector('.search-input');
    musicUpload = document.getElementById('music-upload');
    uploadArea = document.querySelector('.upload-area');
    localTrackList = document.querySelector('.local-track-list');
    trackListEmpty = document.querySelector('.track-list-empty');
    appContainer = document.querySelector('.app-container');
    menuBtn = document.querySelector('.menu-btn');
    playerInfo = document.querySelector('.player-info');
    playerImage = document.querySelector('.player-image');
    
    // 播放/暂停按钮
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }
    
    // 上一曲按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', prevTrack);
    }
    
    // 下一曲按钮
    if (nextBtn) {
        nextBtn.addEventListener('click', nextTrack);
    }
    
    // 进度条控制
    if (progressBar) {
        progressBar.addEventListener('click', setProgress);
        
        // 进度条拖拽功能
        progressBar.addEventListener('mousedown', startDrag);
        // 绑定document级别的事件监听器
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    // 音量条拖动事件监听
    document.addEventListener('mousemove', volumeDrag);
    document.addEventListener('mouseup', stopVolumeDrag);
    
    // 音量控制
    if (volumeBar) {
        volumeBar.addEventListener('click', setVolume);
        // 音量条拖拽功能
        volumeBar.addEventListener('mousedown', startVolumeDrag);
    }
    
    // 收藏按钮
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavorite);
    }
    
    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // 文件上传
    if (musicUpload) {
        musicUpload.addEventListener('change', handleFileUpload);
    }
    
    // 拖拽上传
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#008cff';
            uploadArea.style.backgroundColor = 'rgba(0, 140, 255, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#282828';
            uploadArea.style.backgroundColor = '#181818';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#282828';
            uploadArea.style.backgroundColor = '#181818';
            
            if (e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });
    }
    
    // 菜单按钮（控制侧边栏）
    if (menuBtn) {
        console.log('Menu button found, adding event listener');
        menuBtn.addEventListener('click', window.toggleSidebar);
    } else {
        console.log('Menu button not found');
    }
    
    // 播放器信息区域点击事件（封面动画和全屏模式）
    if (playerInfo) {
        console.log('Player info found, adding click event listener');
        playerInfo.addEventListener('click', handlePlayerInfoClick);
    } else {
        console.log('Player info not found');
    }
}

// 标记悬浮菜单状态
let isFloatingOpen = false;
let isAnimating = false;

// 切换侧边栏显示/隐藏
window.toggleSidebar = function() {
    console.log('toggleSidebar called');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarMode = localStorage.getItem('sidebarMode') || 'follow';
    
    console.log('Sidebar:', sidebar);
    console.log('Main content:', mainContent);
    console.log('Sidebar mode:', sidebarMode);
    console.log('isAnimating:', isAnimating);
    
    if (sidebar && mainContent) {
        console.log('Sidebar classes:', sidebar.className);
        console.log('Main content classes:', mainContent.className);
        
        if (sidebarMode === 'floating') {
            console.log('Floating mode, isFloatingOpen:', isFloatingOpen);
            if (isAnimating) {
                console.log('Animation in progress, ignoring click');
                return;
            }
            if (isFloatingOpen) {
                hideFloatingSidebar(sidebar);
            } else {
                showFloatingSidebar(sidebar);
            }
        } else {
            console.log('Follow mode');
            // 跟随UI模式
            if (sidebar.classList.contains('hidden')) {
                console.log('Showing sidebar in follow mode');
                sidebar.classList.remove('hidden');
                mainContent.style.marginLeft = '240px';
            } else {
                console.log('Hiding sidebar in follow mode');
                sidebar.classList.add('hidden');
                mainContent.style.marginLeft = '0';
            }
        }
    } else {
        console.log('Sidebar or main content not found');
    }
};

// 显示悬浮侧边栏
function showFloatingSidebar(sidebar) {
    isAnimating = true;
    
    // 确保没有动画类
    sidebar.classList.remove('animating');
    
    // 设置到左上角缩小状态
    sidebar.style.transformOrigin = 'top left';
    sidebar.style.transform = 'scale(0.2)';
    sidebar.style.opacity = '0';
    sidebar.style.visibility = 'visible';
    
    // 强制重排
    void sidebar.offsetWidth;
    
    // 添加动画类
    sidebar.classList.add('animating');
    
    // 强制重排
    void sidebar.offsetWidth;
    
    // 动画到正常大小
    sidebar.style.transform = 'scale(1)';
    sidebar.style.opacity = '1';
    
    isFloatingOpen = true;
    
    // 动画结束后
    setTimeout(() => {
        isAnimating = false;
    }, 300);
}

// 隐藏悬浮侧边栏
function hideFloatingSidebar(sidebar) {
    isAnimating = true;
    
    // 确保有动画类
    sidebar.classList.add('animating');
    
    // 动画到左上角缩小状态
    sidebar.style.transformOrigin = 'top left';
    sidebar.style.transform = 'scale(0.2)';
    sidebar.style.opacity = '0';
    
    // 动画结束后
    setTimeout(() => {
        sidebar.classList.remove('animating');
        sidebar.style.visibility = 'hidden';
        isFloatingOpen = false;
        isAnimating = false;
    }, 300);
}



// 开始拖拽
function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    setProgress(e);
}

// 拖拽中
function drag(e) {
    if (isDragging) {
        e.preventDefault();
        setProgress(e);
    }
}

// 停止拖拽
function stopDrag() {
    isDragging = false;
}

// 开始音量拖拽
function startVolumeDrag(e) {
    e.preventDefault();
    isVolumeDragging = true;
    setVolume(e);
}

// 音量拖拽中
function volumeDrag(e) {
    if (isVolumeDragging) {
        e.preventDefault();
        // 直接调用setVolume，传入原始事件
        setVolume(e);
    }
}

// 停止音量拖拽
function stopVolumeDrag() {
    isVolumeDragging = false;
}

// 处理文件上传
function handleFileUpload(e) {
    const files = e.target.files;
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/')) {
            // 检查是否已存在相同文件（使用文件名）
            const existingTrackIndex = tracks.findIndex(track => 
                track.title === file.name.replace(/\.[^/.]+$/, '')
            );
            if (existingTrackIndex !== -1) {
                continue; // 跳过重复文件
            }
            
            // 创建track对象
            const track = {
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: '未知艺术家',
                album: '本地音乐',
                duration: '0:00',
                file: file, // 直接存储File对象
                cover: generateCover('未知歌曲', '未知艺术家')
            };
            
            try {
                // 使用FileReader读取文件
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        // 计算音频时长
                        const audio = new Audio();
                        audio.src = e.target.result;
                        
                        // 加载元数据
                        audio.addEventListener('loadedmetadata', () => {
                            track.duration = formatTime(Math.floor(audio.duration));
                            
                            // 尝试解析音频元数据
                            parseAudioMetadata(file, track);
                            
                            tracks.push(track);
                            if (tracks.length > 0 && trackListEmpty) {
                                trackListEmpty.style.display = 'none';
                            }
                            renderLocalTracks();
                        });
                        
                        // 错误处理
                        audio.addEventListener('error', () => {
                            console.error('Error loading audio:', file.name);
                            // 即使出错也添加到列表
                            tracks.push(track);
                            if (tracks.length > 0 && trackListEmpty) {
                                trackListEmpty.style.display = 'none';
                            }
                            renderLocalTracks();
                        });
                    } catch (e) {
                        console.error('Error processing audio:', e);
                        // 即使出错也添加到列表
                        tracks.push(track);
                        if (tracks.length > 0 && trackListEmpty) {
                            trackListEmpty.style.display = 'none';
                        }
                        renderLocalTracks();
                    }
                };
                
                reader.onerror = () => {
                    console.error('Error reading file:', file.name);
                    // 即使出错也添加到列表
                    tracks.push(track);
                    if (tracks.length > 0 && trackListEmpty) {
                        trackListEmpty.style.display = 'none';
                    }
                    renderLocalTracks();
                };
                
                // 读取文件为Data URL
                reader.readAsDataURL(file);
            } catch (e) {
                console.error('Error processing file:', e);
                // 即使出错也添加到列表
                tracks.push(track);
                if (tracks.length > 0 && trackListEmpty) {
                    trackListEmpty.style.display = 'none';
                }
                renderLocalTracks();
            }
        }
    }
}

// 解析音频元数据
function parseAudioMetadata(file, track) {
    // 先使用jsmediatags解析ID3标签
    if (typeof jsmediatags !== 'undefined') {
        jsmediatags.read(file, {
            onSuccess: function(tag) {
                console.log('=== ID3 tags loaded ===');
                console.log('All tag keys:', Object.keys(tag.tags));
                console.log('Full tags object:', tag.tags);
                
                if (tag.tags) {
                    // 读取标题
                    if (tag.tags.title) {
                        track.title = tag.tags.title;
                    }
                    // 读取艺术家
                    if (tag.tags.artist) {
                        track.artist = tag.tags.artist;
                    }
                    // 读取专辑
                    if (tag.tags.album) {
                        track.album = tag.tags.album;
                    }
                    
                    // 尝试多种方式读取歌词
                    track.lyrics = null;
                    
                    // 列出所有可能的歌词标签
                    const possibleLyricTags = [
                        'lyrics', 'LYRICS', 
                        'USLT', 'uslt',
                        'SYLT', 'sylt',
                        'COMM', 'comm',
                        'comment', 'COMMENT',
                        'unsynchronisedLyrics', 'UnsynchronisedLyrics',
                        'synchronisedLyrics', 'SynchronisedLyrics'
                    ];
                    
                    console.log('Trying to find lyrics in tags...');
                    
                    // 尝试每种可能的标签
                    for (const tagName of possibleLyricTags) {
                        if (tag.tags[tagName] && !track.lyrics) {
                            console.log('Found tag:', tagName, tag.tags[tagName]);
                            
                            const val = tag.tags[tagName];
                            
                            if (typeof val === 'string') {
                                track.lyrics = val;
                                console.log('Set lyrics from string tag:', tagName);
                            } else if (val && typeof val === 'object') {
                                // 尝试从对象中读取
                                if (val.text) {
                                    track.lyrics = val.text;
                                    console.log('Set lyrics from .text property:', tagName);
                                } else if (val.data) {
                                    // 如果是二进制数据，尝试转换
                                    try {
                                        if (Array.isArray(val.data)) {
                                            let str = '';
                                            for (let i = 0; i < val.data.length; i++) {
                                                str += String.fromCharCode(val.data[i]);
                                            }
                                            track.lyrics = str;
                                            console.log('Set lyrics from binary data:', tagName);
                                        }
                                    } catch (e) {
                                        console.log('Error parsing binary data:', e);
                                    }
                                } else if (val.value) {
                                    track.lyrics = val.value;
                                    console.log('Set lyrics from .value property:', tagName);
                                } else {
                                    // 尝试直接字符串化对象
                                    try {
                                        track.lyrics = JSON.stringify(val);
                                        console.log('Set lyrics from stringified object:', tagName);
                                    } catch (e) {
                                        console.log('Error stringifying object:', e);
                                    }
                                }
                            } else if (Array.isArray(val) && val.length > 0) {
                                // 如果是数组，处理每个元素
                                console.log('Tag is array, length:', val.length);
                                for (let i = 0; i < val.length; i++) {
                                    const item = val[i];
                                    if (typeof item === 'string') {
                                        track.lyrics = item;
                                        console.log('Set lyrics from array string item:', tagName, i);
                                        break;
                                    } else if (item && item.text) {
                                        track.lyrics = item.text;
                                        console.log('Set lyrics from array item.text:', tagName, i);
                                        break;
                                    }
                                }
                            }
                            
                            if (track.lyrics) {
                                break;
                            }
                        }
                    }
                    
                    // 如果还没找到，尝试遍历所有标签
                    if (!track.lyrics) {
                        console.log('No lyrics found in known tags, trying all tags...');
                        for (const key in tag.tags) {
                            const keyLower = key.toLowerCase();
                            if (keyLower.includes('lyric') || 
                                keyLower.includes('uslt') || 
                                keyLower.includes('sylt') ||
                                keyLower.includes('comment') ||
                                keyLower.includes('text')) {
                                
                                console.log('Checking possible tag:', key, tag.tags[key]);
                                
                                const val = tag.tags[key];
                                
                                if (typeof val === 'string' && val.length > 10) {
                                    track.lyrics = val;
                                    console.log('Set lyrics from wildcard string tag:', key);
                                    break;
                                } else if (val && val.text && val.text.length > 10) {
                                    track.lyrics = val.text;
                                    console.log('Set lyrics from wildcard .text tag:', key);
                                    break;
                                }
                            }
                        }
                    }
                    
                    console.log('=== Final lyrics result ===');
                    console.log('Has lyrics:', !!track.lyrics);
                    if (track.lyrics) {
                        console.log('Lyrics length:', track.lyrics.length);
                        console.log('Lyrics preview:', track.lyrics.substring(0, 200));
                    }
                    
                    // 读取封面
                    if (tag.tags.picture) {
                        const picture = tag.tags.picture;
                        let base64String = '';
                        for (let i = 0; i < picture.data.length; i++) {
                            base64String += String.fromCharCode(picture.data[i]);
                        }
                        track.cover = 'data:' + picture.format + ';base64,' + btoa(base64String);
                    } else {
                        // 如果没有封面，生成一个简单的
                        track.cover = generateCover(track.title, track.artist);
                    }
                }
                // 重新渲染本地歌曲列表
                renderLocalTracks();
            },
            onError: function(error) {
                console.log('Error parsing ID3 tags:', error);
                // 如果jsmediatags失败，使用文件名解析
                parseMetadataFromFileName(file, track);
                track.lyrics = null;
                // 重新渲染本地歌曲列表
                renderLocalTracks();
            }
        });
    } else {
        // 如果jsmediatags不可用，使用文件名解析
        parseMetadataFromFileName(file, track);
        track.lyrics = null;
    }
}

// 从文件名解析元数据（备用方法）
function parseMetadataFromFileName(file, track) {
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    // 尝试从文件名中提取艺术家和歌曲名
    // 格式: "歌曲名 - 艺术家"
    const parts = fileName.split(' - ');
    if (parts.length === 2) {
        track.title = parts[0].trim();
        track.artist = parts[1].trim();
    } else if (parts.length > 2) {
        // 处理更复杂的情况
        track.title = parts[0].trim();
        track.artist = parts.slice(1).join(' - ').trim();
    }
    
    // 生成简单的封面
    track.cover = generateCover(track.title, track.artist);
}

// 生成简单的封面
function generateCover(title, artist) {
    // 创建一个简单的SVG封面，移除换行和多余空格
    const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#333"/><text x="32" y="24" font-family="Arial" font-size="8" fill="white" text-anchor="middle">${title}</text><text x="32" y="44" font-family="Arial" font-size="6" fill="#ccc" text-anchor="middle">${artist}</text></svg>`;
    // 先进行URL编码，再进行base64编码
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// 渲染本地歌曲列表
function renderLocalTracks() {
    if (!localTrackList) return;
    
    // 清空现有列表
    const existingTracks = localTrackList.querySelectorAll('.track-item');
    existingTracks.forEach(track => track.remove());
    
    // 添加新歌曲
    tracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.innerHTML = `
            <div class="track-cover">
                <img src="${track.cover}" alt="${track.title}">
            </div>
            <div class="track-number">${index + 1}</div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-album">${track.album}</div>
            <div class="track-duration">${track.duration}</div>
        `;
        
        // 添加点击事件
        trackItem.addEventListener('click', () => {
            currentTrack = index;
            playLocalTrack(track);
        });
        
        localTrackList.appendChild(trackItem);
    });
}

// 播放本地歌曲
function playLocalTrack(track) {
    if (!track.file) {
        console.error('No file for track:', track.title);
        return;
    }
    
    // 更新播放器信息
    updatePlayerInfo(track);
    
    // 使用FileReader读取文件
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            // 创建或更新音频元素
            if (audioElement) {
                // 直接设置新的src，这会自动停止当前播放
                audioElement.src = e.target.result;
                // 设置音量和播放速度
                audioElement.volume = currentVolume;
                audioElement.playbackRate = currentSpeed;
            } else {
                audioElement = new Audio(e.target.result);
                // 设置音量和播放速度
                audioElement.volume = currentVolume;
                audioElement.playbackRate = currentSpeed;
                audioElement.addEventListener('timeupdate', updateProgress);
                audioElement.addEventListener('ended', handleTrackEnded);
                
                // 添加错误处理
                audioElement.addEventListener('error', () => {
                    console.error('Error playing audio:', track.title);
                    isPlaying = false;
                    const currentPlayBtn = document.querySelector('.play-btn');
                    if (currentPlayBtn) {
                        const playIcon = currentPlayBtn.querySelector('svg path');
                        if (playIcon) {
                            playIcon.setAttribute('d', 'M8 5v14l11-7z');
                        }
                    }
                });
                
                // 初始化音频可视化（仅在首次创建音频元素时）
                initAudioVisualization();
            }
            
            // 开始播放
            audioElement.play();
            isPlaying = true;
            
            // 更新所有播放按钮
            const playBtns = document.querySelectorAll('.play-btn');
            playBtns.forEach(btn => {
                const playIcon = btn.querySelector('svg path');
                if (playIcon) {
                    playIcon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
                }
            });
            
            // 给所有进度波浪元素添加playing类
            const progressWaves = document.querySelectorAll('.progress-wave');
            progressWaves.forEach(wave => {
                wave.classList.add('playing');
            });
            
            // 开始可视化动画
            startVisualization();
        } catch (e) {
            console.error('Error starting playback:', e);
            isPlaying = false;
            const currentPlayBtn = document.querySelector('.play-btn');
            if (currentPlayBtn) {
                const playIcon = currentPlayBtn.querySelector('svg path');
                if (playIcon) {
                    playIcon.setAttribute('d', 'M8 5v14l11-7z');
                }
            }
        }
    };
    
    reader.onerror = () => {
        console.error('Error reading file for playback:', track.title);
        isPlaying = false;
        const currentPlayBtn = document.querySelector('.play-btn');
        if (currentPlayBtn) {
            const playIcon = currentPlayBtn.querySelector('svg path');
            if (playIcon) {
                playIcon.setAttribute('d', 'M8 5v14l11-7z');
            }
        }
    };
    
    // 读取文件为Data URL
    reader.readAsDataURL(track.file);
}

// 初始化音频可视化
function initAudioVisualization() {
    if (!audioElement) return;
    
    try {
        // 创建音频上下文
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 恢复音频上下文 (现代浏览器需要用户交互)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // 创建分析器
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
        }
        
        // 创建媒体元素源（仅创建一次）
        if (!mediaSource) {
            mediaSource = audioContext.createMediaElementSource(audioElement);
            mediaSource.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // 创建数据数组
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
    } catch (e) {
        console.error('Error initializing audio visualization:', e);
    }
}

// 开始可视化动画
function startVisualization() {
    if (!analyser || !dataArray) return;
    
    // 取消之前的动画
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    function animate() {
        if (!isPlaying) {
            // 停止动画
            cancelAnimationFrame(animationId);
            animationId = null;
            return;
        }
        
        // 获取音频数据
        analyser.getByteFrequencyData(dataArray);
        
        // 计算平均音量
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        // 计算平均音量（保留用于其他可能的功能）
        const average = sum / dataArray.length;
        
        // 移除动态调整动画速度，避免抽搐
        // 保持固定的波浪动画速度
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// 更新播放器信息
function updatePlayerInfo(track) {
    // 更新普通模式的播放器信息
    const playerImage = document.querySelector('.player-image img');
    const trackTitle = document.querySelector('.player-details h4');
    const trackArtist = document.querySelector('.player-details p');
    const favoriteBtn = document.querySelector('.favorite-btn');
    const totalTimeElements = document.querySelectorAll('.time');
    
    // 设置图片
    if (playerImage) {
        playerImage.src = track.cover;
    }
    if (trackTitle) {
        trackTitle.textContent = track.title;
    }
    if (trackArtist) {
        trackArtist.textContent = track.artist;
    }
    
    // 更新总时长
    if (totalTimeElements.length >= 2) {
        totalTimeElements[1].textContent = track.duration;
    }
    
    // 启用收藏按钮
    if (favoriteBtn) {
        favoriteBtn.disabled = false;
        favoriteBtn.style.opacity = '1';
    }
    
    // 更新全屏模式的播放器信息
    const fullscreenCover = document.querySelector('.fullscreen-cover img');
    const fullscreenTitle = document.querySelector('.fullscreen-track-info h2');
    const fullscreenArtist = document.querySelector('.fullscreen-track-info p');
    const fullscreenTimeRight = document.querySelector('.fullscreen-progress .time:last-child');
    
    if (fullscreenCover) {
        fullscreenCover.src = track.cover;
    }
    if (fullscreenTitle) {
        fullscreenTitle.textContent = track.title;
    }
    if (fullscreenArtist) {
        fullscreenArtist.textContent = track.artist;
    }
    if (fullscreenTimeRight) {
        fullscreenTimeRight.textContent = track.duration;
    }
    
    // 更新全屏模式的歌词
    const lyricsContainer = document.querySelector('.fullscreen-lyrics');
    if (lyricsContainer && track.file) {
        parseLyrics(track.file, lyricsContainer);
    }
    
    // 更新全屏背景
    const playerFooter = document.querySelector('.player-footer');
    if (playerFooter && playerFooter.classList.contains('fullscreen')) {
        const savedBackground = localStorage.getItem('fullscreenBackground') || 'monet';
        if (savedBackground === 'blur') {
            playerFooter.style.setProperty('--fullscreen-cover', `url(${track.cover})`);
        } else if (savedBackground === 'monet') {
            applyMonetBackground(track.cover);
        }
    }
    
    // 更新普通模式footer颜色（如果启用了莫奈取色）
    updateFooterColor();
}

// 循环模式状态
let loopMode = 'none'; // 'none', 'all', 'single', 'shuffle'

// 不同循环模式的SVG图标
const loopModeIcons = {
    'none': 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    'all': 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
    'single': 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z',
    'shuffle': 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
};

// 切换循环模式
function toggleLoopMode() {
    const loopModes = ['none', 'all', 'single', 'shuffle'];
    const currentIndex = loopModes.indexOf(loopMode);
    loopMode = loopModes[(currentIndex + 1) % loopModes.length];
    
    // 更新所有循环按钮的图标
    const loopButtons = document.querySelectorAll('.control-btn');
    loopButtons.forEach(btn => {
        const svgPath = btn.querySelector('svg path');
        if (svgPath) {
            // 检查是否是循环按钮（通过检查路径是否匹配任何循环模式的图标）
            const currentD = svgPath.getAttribute('d');
            const isLoopBtn = Object.values(loopModeIcons).some(iconPath => iconPath === currentD);
            
            // 也检查初始路径
            if (isLoopBtn || 
                currentD.includes('M12 4V1') || 
                currentD.includes('M7 7h10v3l4-4-4-4v3') || 
                currentD.includes('M10.59 9.17')) {
                svgPath.setAttribute('d', loopModeIcons[loopMode]);
                // 移除颜色变化，保持原色
            }
        }
    });
    
    console.log('Loop mode changed to:', loopMode);
}

// 切换播放速度
function togglePlaybackSpeed() {
    const currentIndex = speedOptions.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    currentSpeed = speedOptions[nextIndex];
    
    // 更新音频元素的播放速度
    if (audioElement) {
        audioElement.playbackRate = currentSpeed;
    }
    
    // 更新倍速按钮显示
    const speedBtns = document.querySelectorAll('.speed-control-btn');
    speedBtns.forEach(btn => {
        btn.innerHTML = `<div style="font-size: 14px; font-weight: 600;">${currentSpeed}x</div>`;
    });
    
    console.log('Playback speed changed to:', currentSpeed, 'x');
}

// 静音状态
let isMuted = false;
let previousVolume = 1.0;

// 切换静音
function toggleMute() {
    if (isMuted) {
        // 取消静音
        currentVolume = previousVolume;
        isMuted = false;
    } else {
        // 静音
        previousVolume = currentVolume;
        currentVolume = 0;
        isMuted = true;
    }
    
    // 更新音量条
    const volumeFilledElements = document.querySelectorAll('.volume-filled');
    volumeFilledElements.forEach(volumeFilled => {
        volumeFilled.style.width = `${currentVolume * 100}%`;
    });
    
    // 更新音频元素音量
    if (audioElement) {
        audioElement.volume = currentVolume;
    }
    
    // 保存音量设置
    if (!isMuted) {
        localStorage.setItem('volume', currentVolume.toString());
    }
}

// 更新进度条
function updateProgress() {
    if (!audioElement) return;
    
    // 动态获取元素，确保在全屏模式下也能找到
    const timeElements = document.querySelectorAll('.time');
    const progressFilledElements = document.querySelectorAll('.progress-filled');
    
    const currentTime = timeElements[0];
    const totalTime = timeElements[1];
    const currentProgressFilled = progressFilledElements[0] || progressFilledElements[1];
    
    if (currentProgressFilled && currentTime) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        currentProgressFilled.style.width = `${progress}%`;
        currentTime.textContent = formatTime(Math.floor(audioElement.currentTime));
        if (totalTime && tracks[currentTrack]) {
            totalTime.textContent = tracks[currentTrack].duration || '0:00';
        }
    }
    
    // 更新歌词
    updateLyrics();
}

// 歌词滚动状态
let isManualScrollMode = false;
let manualScrollTimeout = null;

// 更新歌词显示
function updateLyrics() {
    if (!window.currentLyrics || window.currentLyrics.length === 0) return;
    
    const currentTime = audioElement.currentTime;
    const lyricsContainer = document.querySelector('.fullscreen-lyrics');
    if (!lyricsContainer) return;
    
    // 找到当前应该高亮的歌词
    let activeIndex = -1;
    for (let i = 0; i < window.currentLyrics.length; i++) {
        if (window.currentLyrics[i].time <= currentTime) {
            activeIndex = i;
        } else {
            break;
        }
    }
    
    // 更新歌词高亮
    const lyricLines = lyricsContainer.querySelectorAll('.lyric-line');
    lyricLines.forEach((line, index) => {
        if (index === activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
    
    // 只有在非手动滚动模式下才自动滚动
    if (!isManualScrollMode && activeIndex >= 0 && lyricLines[activeIndex]) {
        lyricLines[activeIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// 初始化歌词滚动事件
function initLyricsScrollEvents() {
    const lyricsContainer = document.querySelector('.fullscreen-lyrics');
    if (!lyricsContainer) return;
    
    // 监听滚动事件
    lyricsContainer.addEventListener('scroll', function() {
        // 切换到手动滚动模式
        isManualScrollMode = true;
        
        // 清除之前的超时
        if (manualScrollTimeout) {
            clearTimeout(manualScrollTimeout);
        }
        
        // 3秒后切换回自动滚动模式
        manualScrollTimeout = setTimeout(function() {
            isManualScrollMode = false;
        }, 3000);
    });
}

// 清除手动滚动超时
function clearManualScrollTimeout() {
    if (manualScrollTimeout) {
        clearTimeout(manualScrollTimeout);
        manualScrollTimeout = null;
    }
}

// 切换播放/暂停
function togglePlay() {
    if (!audioElement) return;
    
    isPlaying = !isPlaying;
    
    // 更新所有播放按钮图标
    const playBtns = document.querySelectorAll('.play-btn');
    playBtns.forEach(btn => {
        const playIcon = btn.querySelector('svg path');
        if (playIcon) {
            if (isPlaying) {
                playIcon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
            } else {
                playIcon.setAttribute('d', 'M8 5v14l11-7z');
            }
        }
    });
    
    // 更新所有进度波浪元素
    const progressWaves = document.querySelectorAll('.progress-wave');
    progressWaves.forEach(wave => {
        if (isPlaying) {
            wave.classList.add('playing');
        } else {
            wave.classList.remove('playing');
        }
    });
    
    // 控制播放/暂停
    if (isPlaying) {
        audioElement.play();
        // 开始可视化
        startVisualization();
    } else {
        audioElement.pause();
        // 停止可视化
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
}

// 设置进度
function setProgress(e) {
    if (!audioElement) return;
    
    // 动态获取元素，确保在全屏模式下也能找到
    const currentProgressBar = document.querySelector('.progress-bar');
    const currentProgressFilled = document.querySelector('.progress-filled');
    
    if (!currentProgressBar || !currentProgressFilled) return;
    
    const rect = currentProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    let progress = (clickX / width) * 100;
    
    // 确保进度在0-100%之间
    progress = Math.max(0, Math.min(100, progress));
    
    currentProgressFilled.style.width = `${progress}%`;
    
    // 设置音频进度
    const duration = audioElement.duration;
    if (isFinite(duration)) {
        const newTime = (progress / 100) * duration;
        audioElement.currentTime = newTime;
    }
}

// 设置音量
function setVolume(e) {
    // 动态获取音量条元素，确保在全屏模式下也能找到
    const currentVolumeBar = document.querySelector('.volume-bar');
    const currentVolumeFilled = document.querySelector('.volume-filled');
    if (!currentVolumeBar || !currentVolumeFilled) return;
    
    let clickX, width;
    
    if (e.currentTarget && e.currentTarget === currentVolumeBar) {
        // 直接从元素点击
        width = currentVolumeBar.clientWidth;
        clickX = e.offsetX;
    } else {
        // 从拖拽事件或模拟事件
        const rect = currentVolumeBar.getBoundingClientRect();
        width = rect.width;
        clickX = e.clientX - rect.left;
    }
    
    let volume = (clickX / width);
    
    // 确保音量在0-1之间
    volume = Math.max(0, Math.min(1, volume));
    
    currentVolumeFilled.style.width = `${volume * 100}%`;
    
    // 更新当前音量
    currentVolume = volume;
    
    // 保存音量到localStorage
    localStorage.setItem('volume', volume.toString());
    
    // 如果有音频元素，设置其音量
    if (audioElement) {
        audioElement.volume = volume;
    }
}

// 切换收藏状态
function toggleFavorite() {
    const favoriteIcon = this.querySelector('svg path');
    if (favoriteIcon) {
        const currentFill = favoriteIcon.getAttribute('fill');
        
        if (currentFill === 'currentColor') {
            favoriteIcon.setAttribute('fill', '#008cff');
        } else {
            favoriteIcon.setAttribute('fill', 'currentColor');
        }
    }
}

// 处理搜索
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // 过滤歌曲列表
    if (localTrackList) {
        const trackItems = localTrackList.querySelectorAll('.track-item');
        trackItems.forEach((item, index) => {
            const track = tracks[index];
            if (track) {
                const trackText = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
                
                if (trackText.includes(searchTerm)) {
                    item.style.display = 'grid';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }
}

// 上一首歌曲
function prevTrack() {
    if (tracks.length === 0) return;
    
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    playLocalTrack(tracks[currentTrack]);
}

// 保存原始状态的变量
let originalPlayerState = null;

// 处理播放器信息区域点击事件
function handlePlayerInfoClick() {
    console.log('Player info clicked');
    console.log('Audio element:', audioElement);
    console.log('Tracks length:', tracks.length);
    
    // 允许没有音乐时也进入全屏模式
    
    // 获取播放器元素
    const playerFooter = document.querySelector('.player-footer');
    const playerInfo = document.querySelector('.player-info');
    const playerControls = document.querySelector('.player-controls');
    const playerVolume = document.querySelector('.player-volume');
    
    if (!playerFooter || !playerInfo || !playerControls) {
        console.log('Player elements not found');
        return;
    }
    
    // 保存原始状态
    originalPlayerState = {
        footer: {
            className: playerFooter.className,
            style: {
                position: playerFooter.style.position,
                top: playerFooter.style.top,
                left: playerFooter.style.left,
                width: playerFooter.style.width,
                height: playerFooter.style.height,
                display: playerFooter.style.display,
                flexDirection: playerFooter.style.flexDirection,
                background: playerFooter.style.background,
                border: playerFooter.style.border,
                zIndex: playerFooter.style.zIndex
            }
        },
        playerInfo: {
            style: {
                width: playerInfo.style.width,
                display: playerInfo.style.display,
                flexDirection: playerInfo.style.flexDirection,
                alignItems: playerInfo.style.alignItems,
                marginBottom: playerInfo.style.marginBottom
            }
        },
        playerImage: {
            style: {
                width: playerInfo.querySelector('.player-image').style.width,
                height: playerInfo.querySelector('.player-image').style.height,
                margin: playerInfo.querySelector('.player-image').style.margin,
                borderRadius: playerInfo.querySelector('.player-image').style.borderRadius,
                boxShadow: playerInfo.querySelector('.player-image').style.boxShadow
            }
        },
        playerDetails: {
            style: {
                margin: playerInfo.querySelector('.player-details').style.margin,
                textAlign: playerInfo.querySelector('.player-details').style.textAlign
            },
            h4Style: {
                fontSize: playerInfo.querySelector('.player-details h4').style.fontSize,
                fontWeight: playerInfo.querySelector('.player-details h4').style.fontWeight,
                marginBottom: playerInfo.querySelector('.player-details h4').style.marginBottom
            },
            pStyle: {
                fontSize: playerInfo.querySelector('.player-details p').style.fontSize,
                color: playerInfo.querySelector('.player-details p').style.color
            }
        },
        playerFavorite: {
            style: {
                margin: playerInfo.querySelector('.player-favorite').style.margin,
                position: playerInfo.querySelector('.player-favorite').style.position,
                top: playerInfo.querySelector('.player-favorite').style.top,
                right: playerInfo.querySelector('.player-favorite').style.right
            }
        },
        playerControls: {
            style: {
                position: playerControls.style.position,
                bottom: playerControls.style.bottom,
                left: playerControls.style.left,
                width: playerControls.style.width,
                padding: playerControls.style.padding
            }
        },
        playerVolume: {
            style: {
                width: playerVolume.style.width,
                justifyContent: playerVolume.style.justifyContent,
                position: playerVolume.style.position,
                top: playerVolume.style.top,
                right: playerVolume.style.right,
                bottom: playerVolume.style.bottom
            }
        },
        // 保存原始HTML结构
        originalHTML: playerFooter.innerHTML
    };
    
    // 直接进入全屏，不添加延迟
    playerFooter.classList.add('fullscreen');
        
        // 清空播放器内容并重组布局
        playerFooter.innerHTML = '';
        
        // 创建左侧内容容器
        const leftContent = document.createElement('div');
        leftContent.className = 'fullscreen-left';
        
        // 创建大封面图
        const coverContainer = document.createElement('div');
        coverContainer.className = 'fullscreen-cover';
        const coverImg = document.createElement('img');
        coverImg.src = tracks[currentTrack]?.cover || 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2232%22%20font-family%3D%22Arial%22%20font-size%3D%228%22%20fill%3D%22white%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3E音乐%3C%2Ftext%3E%3C%2Fsvg%3E';
        coverContainer.appendChild(coverImg);
        leftContent.appendChild(coverContainer);
        
        // 创建歌曲信息
        const trackInfo = document.createElement('div');
        trackInfo.className = 'fullscreen-track-info';
        trackInfo.innerHTML = `
            <h2>${tracks[currentTrack]?.title || '未播放音乐'}</h2>
            <p>${tracks[currentTrack]?.artist || '请上传音乐'}</p>
        `;
        leftContent.appendChild(trackInfo);
        
        // 声明变量（确保在后面可以引用）
        let progressSection, timeLeft, progressBar, progressFilled, timeRight;
        
        // 创建进度条区域（仅在有音乐时显示）
        if (tracks.length > 0) {
            progressSection = document.createElement('div');
            progressSection.className = 'fullscreen-progress';
            timeLeft = document.createElement('span');
            timeLeft.className = 'time';
            timeLeft.textContent = '0:00';
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressFilled = document.createElement('div');
            progressFilled.className = 'progress-filled';
            progressFilled.style.width = '0%';
            progressBar.appendChild(progressFilled);
            timeRight = document.createElement('span');
            timeRight.className = 'time';
            timeRight.textContent = tracks[currentTrack]?.duration || '0:00';
            progressSection.appendChild(timeLeft);
            progressSection.appendChild(progressBar);
            progressSection.appendChild(timeRight);
            leftContent.appendChild(progressSection);
        }
        
        // 创建控制按钮区域
        const controlsSection = document.createElement('div');
        controlsSection.className = 'fullscreen-controls';
        
        // 循环按钮
        const loopBtn = document.createElement('button');
        loopBtn.className = 'control-btn';
        loopBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>';
        controlsSection.appendChild(loopBtn);
        
        // 上一曲按钮
        const prevBtnNew = document.createElement('button');
        prevBtnNew.className = 'control-btn';
        prevBtnNew.id = 'prev-btn';
        prevBtnNew.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>';
        controlsSection.appendChild(prevBtnNew);
        
        // 播放/暂停按钮
        const playBtnNew = document.createElement('button');
        playBtnNew.className = 'control-btn play-btn';
        playBtnNew.innerHTML = isPlaying 
            ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
            : '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        controlsSection.appendChild(playBtnNew);
        
        // 下一曲按钮
        const nextBtnNew = document.createElement('button');
        nextBtnNew.className = 'control-btn';
        nextBtnNew.id = 'next-btn';
        nextBtnNew.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>';
        controlsSection.appendChild(nextBtnNew);
        
        // 音量控制区域
        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control-container';
        
        // 音量按钮
        const volumeBtnNew = document.createElement('button');
        volumeBtnNew.className = 'control-btn volume-btn-fullscreen';
        volumeBtnNew.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        volumeControl.appendChild(volumeBtnNew);
        
        // 音量弹出窗口
        const volumePopup = document.createElement('div');
        volumePopup.className = 'volume-popup';
        volumePopup.innerHTML = `
            <div class="volume-popup-inner">
                <button class="volume-popup-btn" title="静音">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="black">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                </button>
                <div class="volume-popup-bar">
                    <div class="volume-popup-filled" style="width: ${currentVolume * 100}%"></div>
                </div>
                <span class="volume-popup-value">${Math.round(currentVolume * 100)}</span>
            </div>
        `;
        volumeControl.appendChild(volumePopup);
        
        controlsSection.appendChild(volumeControl);
        
        leftContent.appendChild(controlsSection);
        
        // 创建底部功能按钮
        const bottomBtns = document.createElement('div');
        bottomBtns.className = 'fullscreen-bottom-btns';
        
        // 倍速按钮
        const speedBtn = document.createElement('button');
        speedBtn.className = 'control-btn speed-control-btn';
        speedBtn.innerHTML = `<div style="font-size: 14px; font-weight: 600;">${currentSpeed}x</div>`;
        speedBtn.addEventListener('click', togglePlaybackSpeed);
        bottomBtns.appendChild(speedBtn);
        
        // 喜欢按钮
        const likeBtn = document.createElement('button');
        likeBtn.className = 'control-btn like-btn';
        likeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        // 直接修改按钮的点击处理
        likeBtn.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            const svg = this.querySelector('svg');
            if (svg) {
                // 检查当前是否为亮起状态
                if (this.style.backgroundColor === 'white' || this.style.backgroundColor === '#141e30') {
                    // 恢复默认状态
                    this.style.backgroundColor = '';
                    svg.style.fill = 'currentColor';
                } else {
                    // 根据当前文本颜色决定按钮样式
                    const currentColor = window.getComputedStyle(svg).fill;
                    if (currentColor === 'rgb(255, 255, 255)') {
                        // 白色文字背景：按钮背景白色，图标黑色
                        this.style.backgroundColor = 'white';
                        svg.style.fill = '#141e30';
                    } else {
                        // 黑色文字背景：按钮背景黑色，图标白色
                        this.style.backgroundColor = '#141e30';
                        svg.style.fill = 'white';
                    }
                }
            }
        };
        bottomBtns.appendChild(likeBtn);
        
        const btn3 = document.createElement('button');
        btn3.className = 'control-btn';
        btn3.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"/></svg>';
        bottomBtns.appendChild(btn3);
        
        leftContent.appendChild(bottomBtns);
        
        // 创建右侧内容容器
        const rightContent = document.createElement('div');
        rightContent.className = 'fullscreen-right';
        
        // 创建歌词区域
        const lyricsContainer = document.createElement('div');
        lyricsContainer.className = 'fullscreen-lyrics';
        
        // 尝试解析当前歌曲的歌词
        if (tracks[currentTrack] && tracks[currentTrack].file) {
            parseLyrics(tracks[currentTrack].file, lyricsContainer);
        } else {
            // 默认歌词
            lyricsContainer.innerHTML = `
                <div class="lyric-line">暂无歌词</div>
                <div class="lyric-line active">享受音乐吧</div>
            `;
        }
        
        rightContent.appendChild(lyricsContainer);
        
        // 右下角按钮
        const bottomRightBtns = document.createElement('div');
        bottomRightBtns.className = 'fullscreen-bottom-right';
        
        // 歌词显示/隐藏按钮（使用歌词图标）
        const lyricsToggleBtn = document.createElement('button');
        lyricsToggleBtn.className = 'control-btn lyrics-toggle-btn';
        lyricsToggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H5V7h14v10zM7 10h2v2H7zm0 4h2v2H7zm8-4h2v2h-2zm0 4h2v2h-2z"/></svg>';
        bottomRightBtns.appendChild(lyricsToggleBtn);
        
        // 歌词设置按钮
        const lyricsSettingsBtn = document.createElement('button');
        lyricsSettingsBtn.className = 'control-btn lyrics-settings-btn';
        lyricsSettingsBtn.innerHTML = 'A';
        lyricsSettingsBtn.style.fontSize = '18px';
        lyricsSettingsBtn.style.fontWeight = 'bold';
        bottomRightBtns.appendChild(lyricsSettingsBtn);
        
        rightContent.appendChild(bottomRightBtns);
        
        // 创建歌词设置弹窗
        const lyricsSettingsPopup = document.createElement('div');
        lyricsSettingsPopup.className = 'lyrics-settings-popup';
        lyricsSettingsPopup.innerHTML = `
            <div class="lyrics-settings-inner">
                <div class="lyrics-settings-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="black" class="settings-icon">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    <div class="lyrics-settings-bar">
                        <div class="lyrics-settings-filled" style="width: 50%"></div>
                    </div>
                    <span class="lyrics-settings-value">20</span>
                </div>
                <div class="lyrics-settings-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="black" class="settings-icon">
                        <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/>
                    </svg>
                    <div class="lyrics-settings-bar">
                        <div class="lyrics-settings-filled" style="width: 13.3333%"></div>
                    </div>
                    <span class="lyrics-settings-value">1.2</span>
                </div>
            </div>
        `;
        rightContent.appendChild(lyricsSettingsPopup);
        
        // 添加关闭按钮（顶部长条）
        const closeButton = document.createElement('button');
        closeButton.className = 'close-btn-fullscreen';
        closeButton.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>';
        closeButton.addEventListener('click', exitFullscreenMode);
        
        // 组装全屏布局
        playerFooter.appendChild(closeButton);
        playerFooter.appendChild(leftContent);
        playerFooter.appendChild(rightContent);
        
        // 同步进度条状态（仅在有音乐时）
        if (tracks.length > 0 && progressFilled) {
            const originalProgressFilled = playerControls.querySelector('.progress-filled');
            if (originalProgressFilled) {
                progressFilled.style.width = originalProgressFilled.style.width;
            }
        }
        
        // 同步时间显示（仅在有音乐时）
        if (tracks.length > 0 && timeLeft) {
            const originalTimeElements = playerControls.querySelectorAll('.time');
            if (originalTimeElements.length === 2) {
                timeLeft.textContent = originalTimeElements[0].textContent;
            }
        }
        
        // 立即触发全屏
        playerFooter.classList.add('active');
        leftContent.classList.add('active');
        rightContent.classList.add('active');
        lyricsContainer.classList.add('active');
        
        // 初始化歌词滚动事件监听器
        initLyricsScrollEvents();
        
        // 应用全屏设置
        const savedBackground = localStorage.getItem('fullscreenBackground') || 'monet';
        applyFullscreenBackground(savedBackground);
        
        const savedAlign = localStorage.getItem('lyricsAlign') || 'left';
        applyLyricsAlign(savedAlign);
        
        // 应用默认歌词样式
        applyDefaultLyricsStyle();
        
        // 重新绑定事件监听器
        const fullscreenPlayBtn = playBtnNew;
        const fullscreenPrevBtn = prevBtnNew;
        const fullscreenNextBtn = nextBtnNew;
        const fullscreenProgressBar = progressBar;
        const fullscreenLoopBtn = loopBtn;
        const fullscreenVolumeBtn = volumeBtnNew;
        
        if (fullscreenPlayBtn) {
            fullscreenPlayBtn.addEventListener('click', togglePlay);
        }
        if (fullscreenPrevBtn) {
            fullscreenPrevBtn.addEventListener('click', prevTrack);
        }
        if (fullscreenNextBtn) {
            fullscreenNextBtn.addEventListener('click', nextTrack);
        }
        if (tracks.length > 0 && fullscreenProgressBar) {
            fullscreenProgressBar.addEventListener('click', setProgress);
            fullscreenProgressBar.addEventListener('mousedown', startDrag);
        }
        if (fullscreenLoopBtn) {
            fullscreenLoopBtn.addEventListener('click', toggleLoopMode);
        }
        if (fullscreenVolumeBtn) {
            fullscreenVolumeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const volumePopup = volumeControl.querySelector('.volume-popup');
                if (volumePopup) {
                    volumePopup.classList.toggle('show');
                }
            });
        }
        
        // 音量弹出窗口事件
        if (volumePopup) {
            const volumePopupBar = volumePopup.querySelector('.volume-popup-bar');
            const volumePopupFilled = volumePopup.querySelector('.volume-popup-filled');
            const volumePopupValue = volumePopup.querySelector('.volume-popup-value');
            const volumePopupMuteBtn = volumePopup.querySelector('.volume-popup-btn');
            
            if (volumePopupBar) {
                volumePopupBar.addEventListener('click', function(e) {
                    const rect = volumePopupBar.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    let volume = (clickX / width);
                    volume = Math.max(0, Math.min(1, volume));
                    
                    currentVolume = volume;
                    isMuted = false;
                    
                    if (volumePopupFilled) {
                        volumePopupFilled.style.width = `${volume * 100}%`;
                    }
                    if (volumePopupValue) {
                        volumePopupValue.textContent = Math.round(volume * 100);
                    }
                    
                    if (audioElement) {
                        audioElement.volume = volume;
                    }
                    
                    localStorage.setItem('volume', volume.toString());
                });
                
                let isVolumeDragging = false;
                volumePopupBar.addEventListener('mousedown', function() {
                    isVolumeDragging = true;
                });
                document.addEventListener('mousemove', function(e) {
                    if (isVolumeDragging && volumePopupBar) {
                        const rect = volumePopupBar.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const width = rect.width;
                        let volume = (clickX / width);
                        volume = Math.max(0, Math.min(1, volume));
                        
                        currentVolume = volume;
                        isMuted = false;
                        
                        if (volumePopupFilled) {
                            volumePopupFilled.style.width = `${volume * 100}%`;
                        }
                        if (volumePopupValue) {
                            volumePopupValue.textContent = Math.round(volume * 100);
                        }
                        
                        if (audioElement) {
                            audioElement.volume = volume;
                        }
                    }
                });
                document.addEventListener('mouseup', function() {
                    if (isVolumeDragging) {
                        isVolumeDragging = false;
                        localStorage.setItem('volume', currentVolume.toString());
                    }
                });
            }
            
            if (volumePopupMuteBtn) {
                volumePopupMuteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    toggleMute();
                    
                    if (volumePopupFilled) {
                        volumePopupFilled.style.width = `${currentVolume * 100}%`;
                    }
                    if (volumePopupValue) {
                        volumePopupValue.textContent = Math.round(currentVolume * 100);
                    }
                });
            }
            
            // 点击外部关闭音量弹窗
            document.addEventListener('click', function(e) {
                if (!volumeControl.contains(e.target)) {
                    volumePopup.classList.remove('show');
                }
            });
        }
        
        // 歌词显示/隐藏按钮事件
        if (lyricsToggleBtn) {
            lyricsToggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLyricsVisibility();
            });
        }
        
        // 歌词设置按钮事件
        if (lyricsSettingsBtn) {
            lyricsSettingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const lyricsSettingsPopup = rightContent.querySelector('.lyrics-settings-popup');
                if (lyricsSettingsPopup) {
                    lyricsSettingsPopup.classList.toggle('show');
                }
            });
        }
        
        // 歌词设置弹窗事件
        if (lyricsSettingsPopup) {
            const settingsItems = lyricsSettingsPopup.querySelectorAll('.lyrics-settings-item');
            
            // 字体大小设置
            if (settingsItems[0]) {
                const sizeBar = settingsItems[0].querySelector('.lyrics-settings-bar');
                const sizeFilled = settingsItems[0].querySelector('.lyrics-settings-filled');
                const sizeValue = settingsItems[0].querySelector('.lyrics-settings-value');
                
                if (sizeBar) {
                    sizeBar.addEventListener('click', function(e) {
                        handleLyricsSizeChange(e, sizeFilled, sizeValue, 'fontSize');
                    });
                    
                    let isSizeDragging = false;
                    sizeBar.addEventListener('mousedown', function() {
                        isSizeDragging = true;
                    });
                    document.addEventListener('mousemove', function(e) {
                        if (isSizeDragging && sizeBar) {
                            handleLyricsSizeChange(e, sizeFilled, sizeValue, 'fontSize');
                        }
                    });
                    document.addEventListener('mouseup', function() {
                        if (isSizeDragging) {
                            isSizeDragging = false;
                        }
                    });
                }
            }
            
            // 行间距设置
            if (settingsItems[1]) {
                const lineBar = settingsItems[1].querySelector('.lyrics-settings-bar');
                const lineFilled = settingsItems[1].querySelector('.lyrics-settings-filled');
                const lineValue = settingsItems[1].querySelector('.lyrics-settings-value');
                
                if (lineBar) {
                    lineBar.addEventListener('click', function(e) {
                        handleLyricsSizeChange(e, lineFilled, lineValue, 'lineHeight');
                    });
                    
                    let isLineDragging = false;
                    lineBar.addEventListener('mousedown', function() {
                        isLineDragging = true;
                    });
                    document.addEventListener('mousemove', function(e) {
                        if (isLineDragging && lineBar) {
                            handleLyricsSizeChange(e, lineFilled, lineValue, 'lineHeight');
                        }
                    });
                    document.addEventListener('mouseup', function() {
                        if (isLineDragging) {
                            isLineDragging = false;
                        }
                    });
                }
            }
            
            // 点击外部关闭歌词设置弹窗
            document.addEventListener('click', function(e) {
                if (lyricsSettingsBtn && lyricsSettingsPopup && 
                    !lyricsSettingsBtn.contains(e.target) && 
                    !lyricsSettingsPopup.contains(e.target)) {
                    lyricsSettingsPopup.classList.remove('show');
                }
            });
        }
}

// 解析歌词
function parseLyrics(file, container) {
    try {
        console.log('parseLyrics called, currentTrack:', currentTrack);
        console.log('tracks[currentTrack]:', tracks[currentTrack]);
        
        // 首先检查当前播放的歌曲是否已经有从ID3标签读取的歌词
        if (tracks[currentTrack] && tracks[currentTrack].lyrics) {
            let lyricsText = tracks[currentTrack].lyrics;
            console.log('Found lyrics, length:', lyricsText.length);
            console.log('Lyrics preview:', lyricsText.substring(0, 200));
            
            // 首先尝试解析带时间戳的歌词
            const lyrics = extractLyrics(lyricsText);
            console.log('Parsed timed lyrics count:', lyrics.length);
            
            if (lyrics.length > 0) {
                // 保存歌词数据用于滚动
                window.currentLyrics = lyrics;
                
                // 显示带时间戳的歌词（只显示文本）
                let lyricsHTML = '';
                lyrics.forEach((lyric, index) => {
                    const isActive = index === 0 ? 'active' : '';
                    lyricsHTML += `<div class="lyric-line ${isActive}" data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`;
                });
                container.innerHTML = lyricsHTML;
                console.log('Displayed timed lyrics');
                // 立即应用对齐样式
                const savedAlign = localStorage.getItem('lyricsAlign') || 'left';
                applyLyricsAlign(savedAlign);
                return;
            } else {
                // 如果没有时间戳，直接按行显示
                // 先清理整个歌词文本，移除可能的时间戳
                lyricsText = lyricsText.replace(/\[\d+:\d+(\.\d+)?\]/g, '');
                
                let lines = lyricsText.split('\n');
                // 处理转义的换行符
                if (lines.length === 1 && lyricsText.includes('\\n')) {
                    lines = lyricsText.split('\\n');
                }
                // 过滤掉空行并清理每一行
                lines = lines.map(line => cleanLyricLine(line)).filter(line => line.trim() !== '');
                console.log('Displaying as plain text, lines:', lines.length);
                
                if (lines.length > 0) {
                    window.currentLyrics = null;
                    let lyricsHTML = '';
                    // 显示所有歌词行
                    lines.forEach((line, index) => {
                        const isActive = index === 0 ? 'active' : '';
                        lyricsHTML += `<div class="lyric-line ${isActive}">${line}</div>`;
                    });
                    container.innerHTML = lyricsHTML;
                    console.log('Displayed plain text lyrics');
                    // 立即应用对齐样式
                    const savedAlign = localStorage.getItem('lyricsAlign') || 'left';
                    applyLyricsAlign(savedAlign);
                    return;
                }
            }
        } else {
            console.log('No lyrics found in track');
        }
    } catch (error) {
        console.error('Error parsing lyrics:', error);
    }
    
    // 如果没有ID3歌词或出错，显示默认歌词
    console.log('Displaying default lyrics');
    window.currentLyrics = null;
    container.innerHTML = `
        <div class="lyric-line">暂无歌词</div>
        <div class="lyric-line active">享受音乐吧</div>
    `;
    // 立即应用对齐样式
    const savedAlign = localStorage.getItem('lyricsAlign') || 'left';
    applyLyricsAlign(savedAlign);
}

// 清理歌词行中的不需要的符号
function cleanLyricLine(line) {
    if (!line) return '';
    
    // 移除转义的换行符
    let cleaned = line.replace(/\\n/g, '');
    
    // 移除JSON格式的符号，如 "}," 等
    cleaned = cleaned.replace(/[\{\}\[\]"',]/g, '');
    
    // 移除可能残留的时间戳格式
    cleaned = cleaned.replace(/\[\d+:\d+(\.\d+)?\]/g, '');
    
    // 移除多余的空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// 提取歌词
function extractLyrics(content) {
    const lyrics = [];
    
    // 首先尝试按换行符分割
    let lines = content.split('\n');
    
    // 如果没有正确换行，尝试按常见的分隔符分割
    if (lines.length <= 1) {
        // 尝试按时间戳模式分割
        const timePattern = /(\[\d+:\d+(?:\.\d+)?\])/g;
        const parts = content.split(timePattern);
        
        if (parts.length > 1) {
            // 重新组合时间戳和歌词
            lines = [];
            for (let i = 1; i < parts.length; i += 2) {
                if (parts[i] && parts[i + 1]) {
                    lines.push(parts[i] + parts[i + 1]);
                }
            }
        }
    }
    
    // 匹配歌词格式 [mm:ss.ms] 歌词内容
    const lyricRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]\s*(.+)/;
    
    lines.forEach(line => {
        const match = line.match(lyricRegex);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = match[3] ? parseInt(match[3]) : 0;
            const text = cleanLyricLine(match[4].trim());
            
            if (text) {
                lyrics.push({
                    time: minutes * 60 + seconds + milliseconds / 1000,
                    text: text
                });
            }
        }
    });
    
    // 按时间排序
    lyrics.sort((a, b) => a.time - b.time);
    return lyrics;
}

// 退出全屏模式
function exitFullscreenMode() {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter || !originalPlayerState) return;
    
    // 1. 立即开始淡出全屏内容
    playerFooter.classList.remove('active');
    
    // 2. 立即开始切换到非全屏状态，让淡出和收缩同步进行
    // 等待一小段时间让淡出开始，然后立即恢复状态
    setTimeout(() => {
        // 移除全屏类，footer开始收缩
        playerFooter.classList.remove('fullscreen');
        
        // 恢复原始HTML结构
        playerFooter.innerHTML = originalPlayerState.originalHTML;
        
        // 恢复原始类名和样式
        playerFooter.className = originalPlayerState.footer.className;
        Object.assign(playerFooter.style, originalPlayerState.footer.style);
        
        // 确保footer是可见的
        playerFooter.style.opacity = '1';
        
        // 恢复默认颜色
        resetFooterColors();
        
        // 强制重排
        void playerFooter.offsetWidth;
        
        // 同步所有状态
        // 恢复player-info样式
        const playerInfo = playerFooter.querySelector('.player-info');
        if (playerInfo) {
            Object.assign(playerInfo.style, originalPlayerState.playerInfo.style);
            
            const playerImage = playerInfo.querySelector('.player-image');
            if (playerImage) {
                Object.assign(playerImage.style, originalPlayerState.playerImage.style);
            }
            
            const playerDetails = playerInfo.querySelector('.player-details');
            if (playerDetails) {
                Object.assign(playerDetails.style, originalPlayerState.playerDetails.style);
                const h4 = playerDetails.querySelector('h4');
                if (h4) {
                    Object.assign(h4.style, originalPlayerState.playerDetails.h4Style);
                }
                const p = playerDetails.querySelector('p');
                if (p) {
                    Object.assign(p.style, originalPlayerState.playerDetails.pStyle);
                }
            }
            
            const playerFavorite = playerInfo.querySelector('.player-favorite');
            if (playerFavorite) {
                Object.assign(playerFavorite.style, originalPlayerState.playerFavorite.style);
            }
        }
        
        // 恢复player-controls样式
        const playerControls = playerFooter.querySelector('.player-controls');
        if (playerControls) {
            Object.assign(playerControls.style, originalPlayerState.playerControls.style);
            
            // 同步进度条状态
            const progressFilled = playerControls.querySelector('.progress-filled');
            if (progressFilled && audioElement && audioElement.duration) {
                const progress = (audioElement.currentTime / audioElement.duration) * 100;
                progressFilled.style.width = `${progress}%`;
            }
            
            // 同步进度条动画状态
            const progressWave = playerControls.querySelector('.progress-wave');
            if (progressWave) {
                if (isPlaying) {
                    progressWave.classList.add('playing');
                } else {
                    progressWave.classList.remove('playing');
                }
            }
            
            // 同步播放/暂停按钮状态
            const playBtn = playerControls.querySelector('.play-btn');
            if (playBtn) {
                const playIcon = playBtn.querySelector('svg path');
                if (playIcon) {
                    if (isPlaying) {
                        playIcon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
                    } else {
                        playIcon.setAttribute('d', 'M8 5v14l11-7z');
                    }
                }
            }
            
            // 同步时间显示
            const timeElements = playerControls.querySelectorAll('.time');
            if (timeElements.length === 2 && audioElement) {
                timeElements[0].textContent = formatTime(Math.floor(audioElement.currentTime));
                timeElements[1].textContent = formatTime(Math.floor(audioElement.duration));
            }
        }
        
        // 恢复player-volume样式
        const playerVolume = playerFooter.querySelector('.player-volume');
        if (playerVolume) {
            Object.assign(playerVolume.style, originalPlayerState.playerVolume.style);
            const volumeFilled = playerVolume.querySelector('.volume-filled');
            if (volumeFilled) {
                volumeFilled.style.width = `${currentVolume * 100}%`;
            }
        }
        
        // 重新绑定事件监听器
        setupEventListeners();
        
        // 确保显示最新的播放器信息
        if (tracks[currentTrack]) {
            updatePlayerInfo(tracks[currentTrack]);
        }
        
        // 清空原始状态
        originalPlayerState = null;
    }, 50); // 极短延迟，让淡出和收缩几乎同步开始
}

// 处理歌曲结束
function handleTrackEnded() {
    if (tracks.length === 0) return;
    
    if (loopMode === 'single') {
        // 单曲循环：重新播放当前歌曲
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    } else if (loopMode === 'shuffle') {
        // 随机播放：随机选择下一首（不重复当前）
        let newTrack;
        do {
            newTrack = Math.floor(Math.random() * tracks.length);
        } while (newTrack === currentTrack && tracks.length > 1);
        currentTrack = newTrack;
        playLocalTrack(tracks[currentTrack]);
    } else if (loopMode === 'all') {
        // 列表循环：播放下一首
        currentTrack = (currentTrack + 1) % tracks.length;
        playLocalTrack(tracks[currentTrack]);
    } else {
        // 不循环：如果还有下一首则播放，否则停止
        if (currentTrack < tracks.length - 1) {
            currentTrack++;
            playLocalTrack(tracks[currentTrack]);
        } else {
            isPlaying = false;
            const playBtns = document.querySelectorAll('.play-btn');
            playBtns.forEach(btn => {
                const playIcon = btn.querySelector('svg path');
                if (playIcon) {
                    playIcon.setAttribute('d', 'M8 5v14l11-7z');
                }
            });
            const progressWaves = document.querySelectorAll('.progress-wave');
            progressWaves.forEach(wave => {
                wave.classList.remove('playing');
            });
        }
    }
}

// 下一首歌曲
function nextTrack() {
    if (tracks.length === 0) return;
    
    if (loopMode === 'single') {
        // 单曲循环：重新播放当前歌曲
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    } else if (loopMode === 'shuffle') {
        // 随机播放：随机选择下一首（不重复当前）
        let newTrack;
        do {
            newTrack = Math.floor(Math.random() * tracks.length);
        } while (newTrack === currentTrack && tracks.length > 1);
        currentTrack = newTrack;
        playLocalTrack(tracks[currentTrack]);
    } else {
        // 列表循环或不循环：播放下一首
        currentTrack = (currentTrack + 1) % tracks.length;
        playLocalTrack(tracks[currentTrack]);
    }
}

// 上一首歌曲
function prevTrack() {
    if (tracks.length === 0) return;
    
    if (loopMode === 'shuffle') {
        // 随机播放：随机选择上一首（不重复当前）
        let newTrack;
        do {
            newTrack = Math.floor(Math.random() * tracks.length);
        } while (newTrack === currentTrack && tracks.length > 1);
        currentTrack = newTrack;
        playLocalTrack(tracks[currentTrack]);
    } else {
        // 其他模式：播放上一首
        currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
        playLocalTrack(tracks[currentTrack]);
    }
}

// 格式化秒数为时间字符串
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 响应式布局调整
function handleResize() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        // 在移动设备上，隐藏侧边栏
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
        if (mainContent) {
            mainContent.style.marginLeft = '0';
        }
    } else {
        // 在桌面设备上，显示侧边栏
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }
        if (mainContent) {
            mainContent.style.marginLeft = '240px';
        }
    }
}

// 监听窗口大小变化
window.addEventListener('resize', handleResize);

// 全局变量
let currentActiveContent = null;

// 全局DOM元素引用
let homeContent, playlistContent, settingsContent;

// 初始化播放器
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    initPlayer();
    
    // 确保DOM元素存在
    homeContent = document.getElementById('home-content');
    playlistContent = document.getElementById('playlist-content');
    settingsContent = document.getElementById('settings-content');
    
    console.log('Home content:', homeContent);
    console.log('Playlist content:', playlistContent);
    console.log('Settings content:', settingsContent);
    console.log('Global homeContent:', homeContent);
    
    // 设置首页为默认显示
    if (homeContent) {
        // 确保其他内容区域不显示
        if (playlistContent) {
            playlistContent.classList.remove('active');
            playlistContent.classList.remove('exit');
        }
        if (settingsContent) {
            settingsContent.classList.remove('active');
            settingsContent.classList.remove('exit');
        }
        
        // 确保首页有active类
        homeContent.classList.add('active');
        homeContent.classList.remove('exit');
        currentActiveContent = homeContent;
        
        console.log('Home content classes:', homeContent.className);
        console.log('Home content computed style:', window.getComputedStyle(homeContent).display);
        console.log('currentActiveContent set to:', currentActiveContent.id);
    }
    
    // 初始化侧边栏按钮状态
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    // 确保首页按钮有active类
    const homeBtn = Array.from(sidebarBtns).find(btn => btn.textContent.trim() === '首页');
    if (homeBtn) {
        homeBtn.classList.add('active');
        console.log('Home button activated');
    }
    
    // 初始化主题（在DOM完全加载后）
    initTheme();
    initSidebarMode();
    initFullscreenSettings();
});

// 初始化主题
function initTheme() {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) {
        console.log('Theme select not found');
        return;
    }
    
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    console.log('Initializing theme:', savedTheme);
    
    // 设置初始主题
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSelect.value = savedTheme;
    
    // 监听主题变化
    themeSelect.addEventListener('change', function() {
        const newTheme = this.value;
        console.log('Theme changed to:', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 强制重绘以确保主题立即生效
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    });
}

// 初始化侧边栏模式
function initSidebarMode() {
    const sidebarModeSelect = document.getElementById('sidebar-mode');
    if (!sidebarModeSelect) {
        console.log('Sidebar mode select not found');
        return;
    }
    
    // 从localStorage获取保存的侧边栏模式
    const savedMode = localStorage.getItem('sidebarMode') || 'follow';
    
    console.log('Initializing sidebar mode:', savedMode);
    
    // 设置初始模式
    sidebarModeSelect.value = savedMode;
    applySidebarMode(savedMode);
    
    // 监听模式变化
    sidebarModeSelect.addEventListener('change', function() {
        const newMode = this.value;
        console.log('Sidebar mode changed to:', newMode);
        localStorage.setItem('sidebarMode', newMode);
        applySidebarMode(newMode);
        
        // 强制重绘以确保侧边栏模式立即生效
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    });
}

// 应用侧边栏模式
function applySidebarMode(mode) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar || !mainContent) return;
    
    console.log('Applying sidebar mode:', mode);
    
    // 重置状态
    isFloatingOpen = false;
    
    if (mode === 'floating') {
        // 悬浮菜单模式
        sidebar.classList.add('floating');
        sidebar.classList.remove('animating');
        mainContent.classList.add('floating-sidebar');
        mainContent.style.marginLeft = '0';
        
        // 设置初始状态（缩小在左上角）
        sidebar.style.top = '80px';
        sidebar.style.left = '10px';
        sidebar.style.bottom = 'auto';
        sidebar.style.height = 'auto';
        sidebar.style.transformOrigin = 'top left';
        sidebar.style.transform = 'scale(0.2)';
        sidebar.style.opacity = '0';
        sidebar.style.visibility = 'hidden';
    } else {
        // 跟随UI模式
        sidebar.classList.remove('floating', 'animating');
        mainContent.classList.remove('floating-sidebar');
        mainContent.style.marginLeft = '240px';
        sidebar.classList.remove('hidden');
        
        // 清除内联样式
        sidebar.style.transform = '';
        sidebar.style.opacity = '';
        sidebar.style.visibility = 'visible';
        sidebar.style.top = '70px';
        sidebar.style.left = '0';
        sidebar.style.bottom = '90px';
        sidebar.style.height = '';
    }
}

// 初始化全屏设置
function initFullscreenSettings() {
    const fullscreenBackgroundSelect = document.getElementById('fullscreen-background');
    const lyricsAlignSelect = document.getElementById('lyrics-align');
    const footerMonetCheckbox = document.getElementById('footer-monet');
    const footerMonetContainer = document.getElementById('footer-monet-container');
    
    if (fullscreenBackgroundSelect) {
        const savedBackground = localStorage.getItem('fullscreenBackground') || 'monet';
        fullscreenBackgroundSelect.value = savedBackground;
        
        // 初始化显示/隐藏底栏莫奈取色选项
        toggleFooterMonetVisibility(savedBackground);
        
        fullscreenBackgroundSelect.addEventListener('change', function() {
            const newBackground = this.value;
            localStorage.setItem('fullscreenBackground', newBackground);
            applyFullscreenBackground(newBackground);
            toggleFooterMonetVisibility(newBackground);
        });
    }
    
    if (lyricsAlignSelect) {
        const savedAlign = localStorage.getItem('lyricsAlign') || 'left';
        lyricsAlignSelect.value = savedAlign;
        
        lyricsAlignSelect.addEventListener('change', function() {
            const newAlign = this.value;
            localStorage.setItem('lyricsAlign', newAlign);
            applyLyricsAlign(newAlign);
        });
    }
    
    if (footerMonetCheckbox) {
        const savedFooterMonet = localStorage.getItem('footerMonet') === 'true';
        footerMonetCheckbox.checked = savedFooterMonet;
        
        footerMonetCheckbox.addEventListener('change', function() {
            const isEnabled = this.checked;
            localStorage.setItem('footerMonet', isEnabled.toString());
            
            // 立即应用或恢复footer颜色
            if (tracks[currentTrack]) {
                updateFooterColor();
            }
        });
    }
}

// 切换底栏背景选项的显示/隐藏
function toggleFooterMonetVisibility(background) {
    const footerMonetContainer = document.getElementById('footer-monet-container');
    if (footerMonetContainer) {
        if (background !== 'black') {
            footerMonetContainer.style.display = 'flex';
        } else {
            footerMonetContainer.style.display = 'none';
        }
    }
}

// 更新footer颜色
async function updateFooterColor() {
    const playerFooter = document.querySelector('.player-footer');
    const footerMonetEnabled = localStorage.getItem('footerMonet') === 'true';
    const savedBackground = localStorage.getItem('fullscreenBackground') || 'monet';
    
    if (!playerFooter) return;
    
    if (footerMonetEnabled && tracks[currentTrack]) {
        // 根据不同的背景类型应用不同的底栏效果
        switch (savedBackground) {
            case 'monet':
                // 莫奈取色时，底栏颜色跟随进行莫奈取色
                await applyMonetBackgroundToFooter(tracks[currentTrack].cover);
                break;
            case 'blur':
                // 封面模糊时，切换为封面模糊后裁切
                applyBlurBackgroundToFooter(tracks[currentTrack].cover);
                break;
            case 'acrylic':
                // 亚克力时，则只加背景模糊状态，底栏下有模糊效果
                applyAcrylicBackgroundToFooter();
                break;
            default:
                // 恢复默认颜色（跟随主题）
                playerFooter.style.backgroundColor = '';
                resetFooterColors();
        }
    } else {
        // 恢复默认颜色（跟随主题）
        playerFooter.style.backgroundColor = '';
        resetFooterColors();
    }
}

// 为普通模式footer应用莫奈取色
async function applyMonetBackgroundToFooter(coverUrl) {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter || playerFooter.classList.contains('fullscreen')) return;
    
    try {
        const color = await extractMonetColors(coverUrl);
        // 基于主色调创建纯色背景
        playerFooter.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        playerFooter.style.backgroundImage = '';
        playerFooter.style.backdropFilter = '';
        playerFooter.style.webkitBackdropFilter = '';
        
        // 根据背景颜色决定文字颜色
        const useWhiteText = shouldUseWhiteText(color.r, color.g, color.b);
        
        // 获取所有需要改变颜色的元素
        const textElements = playerFooter.querySelectorAll('h4, p, .time');
        const svgElements = playerFooter.querySelectorAll('svg');
        const controlBtns = playerFooter.querySelectorAll('.control-btn');
        
        // 设置文字颜色
        textElements.forEach(el => {
            el.style.color = useWhiteText ? 'white' : '#141e30';
        });
        
        // 设置SVG和按钮颜色
        const iconColor = useWhiteText ? 'white' : '#141e30';
        svgElements.forEach(el => {
            el.style.fill = iconColor;
        });
        
        controlBtns.forEach(el => {
            el.style.color = iconColor;
        });
        
    } catch (e) {
        console.error('Error applying monet background to footer:', e);
        playerFooter.style.backgroundColor = '';
        playerFooter.style.backgroundImage = '';
        playerFooter.style.backdropFilter = '';
        playerFooter.style.webkitBackdropFilter = '';
        // 恢复默认颜色
        resetFooterColors();
    }
}

// 重置footer颜色为默认
function resetFooterColors() {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter || playerFooter.classList.contains('fullscreen')) return;
    
    // 移除内联样式，让CSS主题生效
    const textElements = playerFooter.querySelectorAll('h4, p, .time');
    const svgElements = playerFooter.querySelectorAll('svg');
    const controlBtns = playerFooter.querySelectorAll('.control-btn');
    
    textElements.forEach(el => {
        el.style.color = '';
    });
    
    svgElements.forEach(el => {
        el.style.fill = '';
    });
    
    controlBtns.forEach(el => {
        el.style.color = '';
    });
}

// 为普通模式footer应用封面模糊效果
function applyBlurBackgroundToFooter(coverUrl) {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter || playerFooter.classList.contains('fullscreen')) return;
    
    try {
        // 设置封面裁切并模糊的效果
        playerFooter.style.backgroundImage = `url(${coverUrl})`;
        playerFooter.style.backgroundSize = 'cover';
        playerFooter.style.backgroundPosition = 'center';
        playerFooter.style.backgroundColor = '';
        playerFooter.style.backdropFilter = 'blur(40px)';
        playerFooter.style.webkitBackdropFilter = 'blur(40px)';
        playerFooter.style.backgroundFilter = 'blur(40px)';
        
        // 设置文字颜色为白色（因为模糊背景通常较暗）
        const textElements = playerFooter.querySelectorAll('h4, p, .time');
        const svgElements = playerFooter.querySelectorAll('svg');
        const controlBtns = playerFooter.querySelectorAll('.control-btn');
        
        textElements.forEach(el => {
            el.style.color = 'white';
        });
        
        svgElements.forEach(el => {
            el.style.fill = 'white';
        });
        
        controlBtns.forEach(el => {
            el.style.color = 'white';
        });
        
    } catch (e) {
        console.error('Error applying blur background to footer:', e);
        playerFooter.style.backgroundImage = '';
        playerFooter.style.backgroundColor = '';
        playerFooter.style.backdropFilter = '';
        playerFooter.style.webkitBackdropFilter = '';
        playerFooter.style.backgroundFilter = '';
        // 恢复默认颜色
        resetFooterColors();
    }
}

// 为普通模式footer应用亚克力效果
function applyAcrylicBackgroundToFooter() {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter || playerFooter.classList.contains('fullscreen')) return;
    
    try {
        // 获取当前主题
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDarkTheme = currentTheme === 'dark';
        
        // 设置亚克力效果：透明背景并带有底层模糊
        playerFooter.style.backgroundColor = isDarkTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        playerFooter.style.backgroundImage = '';
        playerFooter.style.backdropFilter = 'blur(20px) saturate(180%)';
        playerFooter.style.webkitBackdropFilter = 'blur(20px) saturate(180%)';
        
        // 设置文字颜色为主题颜色
        const textElements = playerFooter.querySelectorAll('h4, p, .time');
        const svgElements = playerFooter.querySelectorAll('svg');
        const controlBtns = playerFooter.querySelectorAll('.control-btn');
        
        const textColor = isDarkTheme ? 'white' : '#141e30';
        
        textElements.forEach(el => {
            el.style.color = textColor;
        });
        
        svgElements.forEach(el => {
            el.style.fill = textColor;
        });
        
        controlBtns.forEach(el => {
            el.style.color = textColor;
        });
        
    } catch (e) {
        console.error('Error applying acrylic background to footer:', e);
        playerFooter.style.backgroundColor = '';
        playerFooter.style.backgroundImage = '';
        playerFooter.style.backdropFilter = '';
        playerFooter.style.webkitBackdropFilter = '';
        // 恢复默认颜色
        resetFooterColors();
    }
}

// 应用全屏背景样式
function applyFullscreenBackground(background) {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter) return;
    
    // 移除所有背景类
    playerFooter.classList.remove('background-monet', 'background-blur', 'background-acrylic', 'background-black');
    // 清除内联背景色
    playerFooter.style.backgroundColor = '';
    
    // 添加新的背景类
    playerFooter.classList.add(`background-${background}`);
    
    // 根据背景类型应用样式
    if (background === 'blur' && tracks[currentTrack]) {
        playerFooter.style.setProperty('--fullscreen-cover', `url(${tracks[currentTrack].cover})`);
        // 当切换到非莫奈背景时，恢复底栏默认颜色
        if (!playerFooter.classList.contains('fullscreen')) {
            resetFooterColors();
        }
        // 全屏模式下，设置默认文本颜色为白色（因为模糊背景通常较暗）
        if (playerFooter.classList.contains('fullscreen')) {
            const textElements = playerFooter.querySelectorAll('h2, p, .time, .lyric-line');
            const svgElements = playerFooter.querySelectorAll('svg');
            const controlBtns = playerFooter.querySelectorAll('.control-btn');
            
            textElements.forEach(el => {
                el.style.color = 'white';
            });
            
            svgElements.forEach(el => {
                el.style.fill = 'white';
            });
            
            controlBtns.forEach(el => {
                // 只修改播放/暂停按钮的样式
                if (el.classList.contains('play-btn')) {
                    // 模糊背景下：按钮背景白色，图标黑色
                    el.style.backgroundColor = 'white';
                    el.style.color = '#141e30';
                    // 修正SVG颜色
                    const svg = el.querySelector('svg');
                    if (svg) {
                        svg.style.fill = '#141e30';
                    }
                    // 添加悬停效果
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        this.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    };
                    el.onmouseout = function() {
                        this.style.backgroundColor = 'white';
                    };
                } else {
                    // 恢复其他按钮的默认样式
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        // 只有当按钮没有自定义背景时才应用悬停效果
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                            this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }
                    };
                    el.onmouseout = function() {
                        // 只有当按钮没有自定义背景时才恢复默认
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(255, 255, 255, 0.1)') {
                            this.style.backgroundColor = '';
                        }
                    };
                }
            });
            
            // 初始化歌词切换按钮样式
            initLyricsToggleBtn();
        }
    } else if (background === 'monet' && tracks[currentTrack]) {
        // 应用莫奈取色
        applyMonetBackground(tracks[currentTrack].cover);
    } else {
        // 当切换到非莫奈背景时，恢复底栏默认颜色
        if (!playerFooter.classList.contains('fullscreen')) {
            resetFooterColors();
        }
        // 全屏模式下，根据背景类型设置默认文本颜色
        if (playerFooter.classList.contains('fullscreen')) {
            let textColor = 'white';
            if (background === 'black') {
                textColor = 'white';
            } else if (background === 'acrylic') {
                textColor = 'white';
            }
            
            const textElements = playerFooter.querySelectorAll('h2, p, .time, .lyric-line');
            const svgElements = playerFooter.querySelectorAll('svg');
            const controlBtns = playerFooter.querySelectorAll('.control-btn');
            
            textElements.forEach(el => {
                el.style.color = textColor;
            });
            
            svgElements.forEach(el => {
                el.style.fill = textColor;
            });
            
            controlBtns.forEach(el => {
                // 只修改播放/暂停按钮的样式
                if (el.classList.contains('play-btn')) {
                    // 其他背景下：按钮背景白色，图标黑色
                    el.style.backgroundColor = 'white';
                    el.style.color = '#141e30';
                    // 修正SVG颜色
                    const svg = el.querySelector('svg');
                    if (svg) {
                        svg.style.fill = '#141e30';
                    }
                    // 添加悬停效果
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        this.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    };
                    el.onmouseout = function() {
                        this.style.backgroundColor = 'white';
                    };
                } else {
                    // 恢复其他按钮的默认样式
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        // 只有当按钮没有自定义背景时才应用悬停效果
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                            this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }
                    };
                    el.onmouseout = function() {
                        // 只有当按钮没有自定义背景时才恢复默认
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(255, 255, 255, 0.1)') {
                            this.style.backgroundColor = '';
                        }
                    };
                }
            });
            
            // 初始化歌词切换按钮样式
            initLyricsToggleBtn();
        }
    }
}

// 应用歌词对齐样式
function applyLyricsAlign(align) {
    const lyricsContainer = document.querySelector('.fullscreen-lyrics');
    if (!lyricsContainer) return;
    
    // 移除所有对齐类
    lyricsContainer.classList.remove('align-left', 'align-center');
    
    // 添加新的对齐类
    lyricsContainer.classList.add(`align-${align}`);
}

// 计算颜色亮度
function getColorLuminance(r, g, b) {
    // 标准亮度计算公式
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 判断应该使用白色还是黑色文字
function shouldUseWhiteText(r, g, b) {
    const luminance = getColorLuminance(r, g, b);
    // 阈值：亮度低于128使用白色文字，高于128使用黑色文字
    return luminance < 128;
}

// 从封面提取主色调（莫奈取色）
function extractMonetColors(coverUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            try {
                // 创建canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 50;
                canvas.height = 50;
                
                // 绘制图片到canvas
                ctx.drawImage(img, 0, 0, 50, 50);
                
                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, 50, 50);
                const pixels = imageData.data;
                
                // 统计颜色
                const colorCounts = {};
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let i = 0; i < pixels.length; i += 4) {
                    const pixelR = pixels[i];
                    const pixelG = pixels[i + 1];
                    const pixelB = pixels[i + 2];
                    const alpha = pixels[i + 3];
                    
                    // 跳过透明像素
                    if (alpha < 128) continue;
                    
                    // 降低颜色精度以聚类
                    const key = `${Math.floor(pixelR / 32)}-${Math.floor(pixelG / 32)}-${Math.floor(pixelB / 32)}`;
                    
                    if (!colorCounts[key]) {
                        colorCounts[key] = { r: pixelR, g: pixelG, b: pixelB, count: 0 };
                    }
                    colorCounts[key].count++;
                    
                    r += pixelR;
                    g += pixelG;
                    b += pixelB;
                    count++;
                }
                
                if (count > 0) {
                    // 找到出现次数最多的颜色
                    let maxCount = 0;
                    let dominantColor = { r: Math.floor(r / count), g: Math.floor(g / count), b: Math.floor(b / count) };
                    
                    for (const key in colorCounts) {
                        if (colorCounts[key].count > maxCount) {
                            maxCount = colorCounts[key].count;
                            dominantColor = colorCounts[key];
                        }
                    }
                    
                    resolve(dominantColor);
                } else {
                    // 默认颜色
                    resolve({ r: 20, g: 30, b: 48 });
                }
            } catch (e) {
                console.error('Error extracting colors:', e);
                resolve({ r: 20, g: 30, b: 48 });
            }
        };
        
        img.onerror = function() {
            resolve({ r: 20, g: 30, b: 48 });
        };
        
        img.src = coverUrl;
    });
}

// 应用莫奈取色背景
async function applyMonetBackground(coverUrl) {
    const playerFooter = document.querySelector('.player-footer');
    if (!playerFooter) return;
    
    // 检查是否在全屏模式
    if (playerFooter.classList.contains('fullscreen')) {
        // 全屏模式下直接应用莫奈取色
        try {
            const color = await extractMonetColors(coverUrl);
            // 基于主色调创建深色渐变背景
            playerFooter.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
            
            // 根据背景颜色决定文字和图标颜色
            const useWhiteText = shouldUseWhiteText(color.r, color.g, color.b);
            const textColor = useWhiteText ? 'white' : '#141e30';
            
            // 获取全屏模式下的所有文本和图标元素
            const textElements = playerFooter.querySelectorAll('h2, p, .time, .lyric-line');
            const svgElements = playerFooter.querySelectorAll('svg');
            const controlBtns = playerFooter.querySelectorAll('.control-btn');
            
            // 设置文本颜色
            textElements.forEach(el => {
                el.style.color = textColor;
            });
            
            // 设置SVG和按钮颜色
            svgElements.forEach(el => {
                el.style.fill = textColor;
            });
            
            controlBtns.forEach(el => {
                el.style.color = textColor;
                // 只修改播放/暂停按钮的样式
                if (el.classList.contains('play-btn')) {
                    // 根据背景颜色设置按钮样式
                    if (useWhiteText) {
                        // 深色背景：按钮背景白色，图标黑色
                        el.style.backgroundColor = 'white';
                        el.style.color = '#141e30';
                        // 修正SVG颜色
                        const svg = el.querySelector('svg');
                        if (svg) {
                            svg.style.fill = '#141e30';
                        }
                    } else {
                        // 浅色背景：按钮背景黑色，图标白色
                        el.style.backgroundColor = '#141e30';
                        el.style.color = 'white';
                        // 修正SVG颜色
                        const svg = el.querySelector('svg');
                        if (svg) {
                            svg.style.fill = 'white';
                        }
                    }
                    // 添加悬停效果
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        if (useWhiteText) {
                            this.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                        } else {
                            this.style.backgroundColor = 'rgba(20, 30, 48, 0.8)';
                        }
                    };
                    el.onmouseout = function() {
                        if (useWhiteText) {
                            this.style.backgroundColor = 'white';
                        } else {
                            this.style.backgroundColor = '#141e30';
                        }
                    };
                } else {
                    // 恢复其他按钮的默认样式
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        // 只有当按钮没有自定义背景时才应用悬停效果
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                            this.style.backgroundColor = useWhiteText ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    };
                    el.onmouseout = function() {
                        // 只有当按钮没有自定义背景时才恢复默认
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(255, 255, 255, 0.1)' || this.style.backgroundColor === 'rgba(0, 0, 0, 0.1)') {
                            this.style.backgroundColor = '';
                        }
                    };
                }
            });
            
            // 初始化歌词切换按钮样式
            initLyricsToggleBtn();
        } catch (e) {
            console.error('Error applying monet background:', e);
            playerFooter.style.backgroundColor = 'rgba(20, 30, 48, 0.9)';
            
            // 错误时默认使用白色文字
            const textElements = playerFooter.querySelectorAll('h2, p, .time, .lyric-line');
            const svgElements = playerFooter.querySelectorAll('svg');
            const controlBtns = playerFooter.querySelectorAll('.control-btn');
            
            textElements.forEach(el => {
                el.style.color = 'white';
            });
            
            svgElements.forEach(el => {
                el.style.fill = 'white';
            });
            
            controlBtns.forEach(el => {
                // 只修改播放/暂停按钮的样式
                if (el.classList.contains('play-btn')) {
                    // 错误时默认使用白色背景，黑色图标
                    el.style.backgroundColor = 'white';
                    el.style.color = '#141e30';
                    // 修正SVG颜色
                    const svg = el.querySelector('svg');
                    if (svg) {
                        svg.style.fill = '#141e30';
                    }
                    // 添加悬停效果
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        this.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    };
                    el.onmouseout = function() {
                        this.style.backgroundColor = 'white';
                    };
                } else {
                    // 恢复其他按钮的默认样式
                    el.style.transition = 'background-color 0.2s ease';
                    el.onmouseover = function() {
                        // 只有当按钮没有自定义背景时才应用悬停效果
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
                            this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }
                    };
                    el.onmouseout = function() {
                        // 只有当按钮没有自定义背景时才恢复默认
                        if (!this.style.backgroundColor || this.style.backgroundColor === 'rgba(255, 255, 255, 0.1)') {
                            this.style.backgroundColor = '';
                        }
                    };
                }
            });
            
            // 初始化歌词切换按钮样式
            initLyricsToggleBtn();
        }
    } else {
        // 普通模式下，只有当底栏莫奈取色开关开启时才应用
        const footerMonetEnabled = localStorage.getItem('footerMonet') === 'true';
        if (footerMonetEnabled) {
            await applyMonetBackgroundToFooter(coverUrl);
        } else {
            // 否则恢复默认颜色
            resetFooterColors();
        }
    }
}

// 为内容元素添加动画结束监听
const setupAnimationEndListeners = () => {
    const homeContent = document.getElementById('home-content');
    const playlistContent = document.getElementById('playlist-content');
    const settingsContent = document.getElementById('settings-content');
    
    const contentSections = [homeContent, playlistContent, settingsContent];
    
    contentSections.forEach(content => {
        if (content) {
            content.addEventListener('transitionend', function() {
                if (this.classList.contains('exit')) {
                    this.style.display = 'none';
                    this.classList.remove('exit');
                }
            });
        }
    });
};

// 初始化动画结束监听
window.addEventListener('DOMContentLoaded', setupAnimationEndListeners);

// 处理侧边栏按钮点击
window.addEventListener('DOMContentLoaded', function() {
    // 保存DOM元素引用
    homeContent = document.getElementById('home-content');
    playlistContent = document.getElementById('playlist-content');
    settingsContent = document.getElementById('settings-content');
    
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    
    console.log('Sidebar buttons found:', sidebarBtns.length);
    console.log('Global homeContent:', homeContent);
    console.log('Global currentActiveContent:', currentActiveContent);
    
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            sidebarBtns.forEach(b => b.classList.remove('active'));
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 检查点击的是哪个按钮
            const buttonText = this.textContent.trim();
            
            // 确定要显示的内容
            let contentToShow;
            if (buttonText === '首页') {
                contentToShow = homeContent;
            } else if (buttonText === '播放列表') {
                contentToShow = playlistContent;
            } else if (buttonText === '设置') {
                contentToShow = settingsContent;
            }
            
            console.log('Button clicked:', buttonText);
            console.log('Content to show:', contentToShow);
            console.log('Current active content:', currentActiveContent);
            
            // 如果点击的是当前已激活的页面，不执行动画
            if (contentToShow === currentActiveContent) {
                console.log('Same content, skipping');
                return;
            }
            
            // 执行页面切换动画
            if (contentToShow) {
                // 保存当前元素的引用
                const currentElement = currentActiveContent;
                
                // 为当前活动内容添加exit类，使其向左移动退出
                if (currentElement) {
                    console.log('Adding exit class to current content:', currentElement);
                    
                    // 移除active类
                    currentElement.classList.remove('active');
                    
                    // 确保元素可见且处于正确状态
                    currentElement.style.display = 'block';
                    currentElement.style.opacity = '1';
                    currentElement.style.transform = 'translateX(0)';
                    
                    // 强制重排
                    void currentElement.offsetWidth;
                    
                    // 添加exit类，触发退出动画
                    currentElement.classList.add('exit');
                    
                    // 动画结束后隐藏元素
                    currentElement.addEventListener('transitionend', function handler() {
                        currentElement.style.display = 'none';
                        currentElement.classList.remove('exit');
                        currentElement.removeEventListener('transitionend', handler);
                    }, { once: true });
                } else {
                    console.log('No current active content, initializing...');
                    // 如果没有当前活动内容，确保所有内容区域都不显示
                    if (homeContent) {
                        homeContent.classList.remove('active');
                        homeContent.style.display = 'none';
                    }
                    if (playlistContent) {
                        playlistContent.classList.remove('active');
                        playlistContent.style.display = 'none';
                    }
                    if (settingsContent) {
                        settingsContent.classList.remove('active');
                        settingsContent.style.display = 'none';
                    }
                }
                
                // 延迟显示新内容，让退出动画先执行
                setTimeout(() => {
                    // 显示新内容
                    console.log('Showing new content:', contentToShow);
                    // 重置新内容的状态，确保它从右侧进入
                    contentToShow.classList.remove('active', 'exit');
                    contentToShow.style.display = 'block';
                    contentToShow.style.transform = 'translateX(100%)';
                    contentToShow.style.opacity = '0';
                    
                    // 强制重排以确保动画正确触发
                    void contentToShow.offsetWidth;
                    
                    // 触发进入动画
                    contentToShow.classList.add('active');
                }, 100);
                
                // 更新当前活动内容
                currentActiveContent = contentToShow;
                console.log('Current active content updated to:', currentActiveContent);
            }
        });
    });
});

// 应用默认歌词样式
function applyDefaultLyricsStyle() {
    const lyricLines = document.querySelectorAll('.lyric-line');
    lyricLines.forEach(line => {
        line.style.fontSize = '20px';
        line.style.lineHeight = '1.2';
    });
}

// 切换歌词显示/隐藏
function toggleLyricsVisibility() {
    const lyricsContainer = document.querySelector('.fullscreen-lyrics');
    const rightContent = document.querySelector('.fullscreen-right');
    const leftContent = document.querySelector('.fullscreen-left');
    const lyricsToggleBtn = document.querySelector('.lyrics-toggle-btn');
    
    if (!lyricsContainer || !rightContent || !leftContent || !lyricsToggleBtn) return;
    
    // 获取当前文本颜色
    const textElements = document.querySelectorAll('.fullscreen-track-info h2');
    let currentTextColor = 'rgb(255, 255, 255)'; // 默认白色
    if (textElements.length > 0) {
        currentTextColor = window.getComputedStyle(textElements[0]).color;
    }
    
    if (rightContent.classList.contains('lyrics-hidden')) {
        // 显示歌词
        rightContent.classList.remove('lyrics-hidden');
        leftContent.classList.remove('centered');
        
        // 先设置为绝对定位，定位到右下角
        rightContent.style.position = 'absolute';
        rightContent.style.right = '20px';
        rightContent.style.bottom = '80px';
        rightContent.style.left = 'auto';
        rightContent.style.top = 'auto';
        rightContent.style.width = 'auto';
        rightContent.style.maxWidth = 'none';
        rightContent.style.transform = 'translate(0, 0)';
        rightContent.style.transition = 'none';
        
        // 强制重排
        void rightContent.offsetWidth;
        
        // 添加过渡动画效果
        rightContent.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // 强制重排
        void rightContent.offsetWidth;
        
        // 动画到原始位置
        rightContent.style.position = 'static';
        rightContent.style.right = '';
        rightContent.style.bottom = '';
        rightContent.style.left = '';
        rightContent.style.top = '';
        rightContent.style.width = '';
        rightContent.style.maxWidth = '';
        
        // 根据当前文本颜色决定按钮样式
        if (currentTextColor === 'rgb(255, 255, 255)') {
            // 白色文字背景：按钮背景白色，图标黑色
            lyricsToggleBtn.style.backgroundColor = 'white';
            lyricsToggleBtn.style.color = '#141e30';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = '#141e30';
            }
        } else {
            // 黑色文字背景：按钮背景黑色，图标白色
            lyricsToggleBtn.style.backgroundColor = '#141e30';
            lyricsToggleBtn.style.color = 'white';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'white';
            }
        }
    } else {
        // 隐藏歌词
        rightContent.classList.add('lyrics-hidden');
        leftContent.classList.add('centered');
        
        // 先设置为static定位，确保元素在正确的初始位置
        rightContent.style.position = 'static';
        rightContent.style.right = '';
        rightContent.style.bottom = '';
        rightContent.style.left = '';
        rightContent.style.top = '';
        rightContent.style.width = '';
        rightContent.style.maxWidth = '';
        rightContent.style.transform = 'translate(0, 0)';
        rightContent.style.transition = 'none';
        
        // 强制重排
        void rightContent.offsetWidth;
        
        // 添加过渡动画效果
        rightContent.style.transition = 'all 0.5s ease-out';
        
        // 强制重排
        void rightContent.offsetWidth;
        
        // 计算原始位置
        const originalRect = rightContent.getBoundingClientRect();
        const playerFooter = document.querySelector('.player-footer');
        const footerRect = playerFooter.getBoundingClientRect();
        
        // 计算目标位置（右下角）
        const targetRight = 20; // 右边距
        const targetBottom = 80; // 底边距
        
        // 计算偏移量
        const offsetX = (footerRect.width - originalRect.right) + targetRight;
        const offsetY = (footerRect.height - originalRect.bottom) + targetBottom;
        
        // 动画到右下角
        rightContent.style.position = 'absolute';
        rightContent.style.right = '20px';
        rightContent.style.bottom = '80px';
        rightContent.style.left = 'auto';
        rightContent.style.top = 'auto';
        rightContent.style.width = 'auto';
        rightContent.style.maxWidth = 'none';
        
        // 等待动画完成后添加回弹效果
        setTimeout(() => {
            // 添加回弹动画
            rightContent.style.transition = 'all 0.3s ease-in-out';
            rightContent.style.transform = 'translate(10px, 10px)';
            
            // 再次回弹到最终位置
            setTimeout(() => {
                rightContent.style.transform = 'translate(0, 0)';
            }, 150);
        }, 500);
        
        // 根据当前文本颜色决定按钮样式
        if (currentTextColor === 'rgb(255, 255, 255)') {
            // 白色文字背景：按钮背景半透明白色，图标半透明白色
            lyricsToggleBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            lyricsToggleBtn.style.color = 'rgba(255, 255, 255, 0.7)';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'rgba(255, 255, 255, 0.7)';
            }
        } else {
            // 黑色文字背景：按钮背景半透明黑色，图标半透明黑色
            lyricsToggleBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            lyricsToggleBtn.style.color = 'rgba(0, 0, 0, 0.7)';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'rgba(0, 0, 0, 0.7)';
            }
        }
    }
}

// 初始化歌词切换按钮样式
function initLyricsToggleBtn() {
    const lyricsToggleBtn = document.querySelector('.lyrics-toggle-btn');
    if (!lyricsToggleBtn) return;
    
    // 确保按钮初始状态正确
    const rightContent = document.querySelector('.fullscreen-right');
    if (!rightContent) return;
    
    // 获取当前文本颜色
    const textElements = document.querySelectorAll('.fullscreen-track-info h2');
    let currentTextColor = 'rgb(255, 255, 255)'; // 默认白色
    if (textElements.length > 0) {
        currentTextColor = window.getComputedStyle(textElements[0]).color;
    }
    
    // 根据当前状态和文本颜色设置按钮样式
    if (!rightContent.classList.contains('lyrics-hidden')) {
        // 显示歌词状态
        // 直接设置transform属性，确保元素回到原位
        rightContent.style.transform = 'translate(0, 0)';
        rightContent.style.position = 'static';
        rightContent.style.left = 'auto';
        rightContent.style.top = 'auto';
        
        if (currentTextColor === 'rgb(255, 255, 255)') {
            // 白色文字背景：按钮背景白色，图标黑色
            lyricsToggleBtn.style.backgroundColor = 'white';
            lyricsToggleBtn.style.color = '#141e30';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = '#141e30';
            }
        } else {
            // 黑色文字背景：按钮背景黑色，图标白色
            lyricsToggleBtn.style.backgroundColor = '#141e30';
            lyricsToggleBtn.style.color = 'white';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'white';
            }
        }
    } else {
        // 隐藏歌词状态
        // 直接设置transform属性，确保元素移动到屏幕右下角
        rightContent.style.position = 'absolute';
        rightContent.style.right = '20px';
        rightContent.style.bottom = '80px';
        rightContent.style.left = 'auto';
        rightContent.style.top = 'auto';
        rightContent.style.transform = 'translate(0, 0)';
        rightContent.style.width = 'auto';
        rightContent.style.maxWidth = 'none';
        
        if (currentTextColor === 'rgb(255, 255, 255)') {
            // 白色文字背景：按钮背景半透明白色，图标半透明白色
            lyricsToggleBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            lyricsToggleBtn.style.color = 'rgba(255, 255, 255, 0.7)';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'rgba(255, 255, 255, 0.7)';
            }
        } else {
            // 黑色文字背景：按钮背景半透明黑色，图标半透明黑色
            lyricsToggleBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            lyricsToggleBtn.style.color = 'rgba(0, 0, 0, 0.7)';
            // 修正SVG颜色
            const svg = lyricsToggleBtn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'rgba(0, 0, 0, 0.7)';
            }
        }
    }
}

// 处理歌词大小和行间距变化
function handleLyricsSizeChange(e, filledEl, valueEl, type) {
    const rect = filledEl.parentElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    let value;
    
    if (type === 'fontSize') {
        // 字体大小范围：12px - 28px
        value = Math.round(12 + (clickX / width) * 16);
        value = Math.max(12, Math.min(28, value));
        valueEl.textContent = value;
        
        // 应用字体大小
        const lyricLines = document.querySelectorAll('.lyric-line');
        lyricLines.forEach(line => {
            line.style.fontSize = value + 'px';
        });
    } else if (type === 'lineHeight') {
        // 行间距范围：1.0 - 2.5
        value = (1.0 + (clickX / width) * 1.5).toFixed(1);
        value = Math.max(1.0, Math.min(2.5, parseFloat(value))).toFixed(1);
        valueEl.textContent = value;
        
        // 应用行间距
        const lyricLines = document.querySelectorAll('.lyric-line');
        lyricLines.forEach(line => {
            line.style.lineHeight = value;
        });
    }
    
    // 更新进度条
    const progress = ((value - (type === 'fontSize' ? 12 : 1.0)) / ((type === 'fontSize' ? 16 : 1.5))) * 100;
    filledEl.style.width = Math.max(0, Math.min(100, progress)) + '%';
}

// 在浏览器控制台输入getlrctext()时，输出当前播放歌曲获取到的lrc歌词文本
window.getlrctext = function() {
    if (tracks && tracks[currentTrack] && tracks[currentTrack].lyrics) {
        console.log('当前播放歌曲的LRC歌词：');
        console.log(tracks[currentTrack].lyrics);
        return tracks[currentTrack].lyrics;
    } else {
        console.log('当前没有播放歌曲或歌曲没有歌词');
        return null;
    }
};

// 在浏览器控制台输入getplaystatus()时，输出当前播放器的状态和播放进度
window.getplaystatus = function() {
    if (audioElement) {
        const status = isPlaying ? 'playing' : 'paused';
        const currentTime = audioElement.currentTime.toFixed(2);
        const statusText = `${status}:${currentTime}s`;
        console.log(statusText);
        return statusText;
    } else {
        console.log('当前没有音频元素');
        return null;
    }
};
