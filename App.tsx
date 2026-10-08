/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as OpenCC from 'opencc-js';
import { originalSimplifiedHTML } from './sutraContent';

export default function App() {
  // 状态管理
  const [currentLang, setCurrentLang] = useState<'simplified' | 'traditional'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('lang') === 'tw') {
        return 'traditional';
      }
      const savedLang = localStorage.getItem('prefLang');
      if (savedLang === 'traditional' || savedLang === 'simplified') {
        return savedLang;
      }
    }
    return 'simplified';
  });

  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('prefTheme') === 'light';
    }
    return false;
  });

  const [fontSize, setFontSize] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const savedFont = localStorage.getItem('prefFontSize');
      if (savedFont) {
        const parsed = parseFloat(savedFont);
        if (!isNaN(parsed) && parsed >= 12 && parsed <= 36) {
          return parsed;
        }
      }
    }
    return null;
  });

  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sutraRef = useRef<HTMLDivElement>(null);

  // 初始化 OpenCC 转换器
  const converter = useMemo(() => {
    try {
      return OpenCC.Converter({ from: 'cn', to: 'tw' });
    } catch (e) {
      console.error('OpenCC init error:', e);
      return null;
    }
  }, []);

  // 繁体 HTML 缓存
  const traditionalHTML = useMemo(() => {
    if (converter) {
      try {
        return converter(originalSimplifiedHTML);
      } catch (err) {
        console.error('Conversion failed:', err);
      }
    }
    return originalSimplifiedHTML;
  }, [converter]);

  // 主题切换副作用
  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('prefTheme', isLight ? 'light' : 'dark');
  }, [isLight]);

  // 语言保存
  useEffect(() => {
    localStorage.setItem('prefLang', currentLang);
  }, [currentLang]);

  // 处理视频点击播放
  const handlePlayVideo = () => {
    setIsVideoVisible(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch((e) => {
          console.log('自动播放被阻止:', e);
        });
      }
    }, 50);
  };

  // 简繁切换
  const handleToggleLang = () => {
    setCurrentLang((prev) => (prev === 'simplified' ? 'traditional' : 'simplified'));
  };

  // 亮/暗模式切换
  const handleToggleMode = () => {
    setIsLight((prev) => !prev);
  };

  // 字体放大
  const handleZoomIn = () => {
    let current = fontSize;
    if (current === null && sutraRef.current) {
      current = parseFloat(window.getComputedStyle(sutraRef.current).fontSize) || 16;
    }
    const newSize = Math.min(36, (current || 16) + 1);
    setFontSize(newSize);
    localStorage.setItem('prefFontSize', `${newSize}px`);
  };

  // 字体缩小
  const handleZoomOut = () => {
    let current = fontSize;
    if (current === null && sutraRef.current) {
      current = parseFloat(window.getComputedStyle(sutraRef.current).fontSize) || 16;
    }
    const newSize = Math.max(12, (current || 16) - 1);
    setFontSize(newSize);
    localStorage.setItem('prefFontSize', `${newSize}px`);
  };

  // 重置设置到默认状态
  const handleResetSettings = () => {
    localStorage.removeItem('prefLang');
    localStorage.removeItem('prefTheme');
    localStorage.removeItem('prefFontSize');
    setCurrentLang('simplified');
    setIsLight(false);
    setFontSize(null);
    setToastMessage(isTraditional ? '已恢復預設設定' : '已恢复默认设置');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 分享链接复制
  const handleShareLink = async () => {
    const urlToCopy = 'https://www.amtb.cc';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setToastMessage(`链接已复制到剪贴板: ${urlToCopy}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('无法复制链接: ', err);
      setToastMessage(`链接: ${urlToCopy}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const isTraditional = currentLang === 'traditional';
  const currentContent = isTraditional ? traditionalHTML : originalSimplifiedHTML;

  return (
    <>
      {/* 浮动控制栏: 完全浮定 (fixed + 玻璃质感) */}
      <div id="topControls">
        <div id="fontControls">
          <button id="toggleLang" aria-label="简繁切换" onClick={handleToggleLang}>
            {isTraditional ? '简' : '繁'}
          </button>
          <button id="toggleMode" aria-label="亮色/暗色模式" onClick={handleToggleMode}>
            {isLight ? '暗' : '亮'}
          </button>
          <button id="zoomIn" aria-label="放大字体" onClick={handleZoomIn}>
            大
          </button>
          <button id="zoomOut" aria-label="缩小字体" onClick={handleZoomOut}>
            小
          </button>
          <button id="resetSettings" aria-label="重置设置" onClick={handleResetSettings}>
            {isTraditional ? '重置' : '重置'}
          </button>
          <button id="shareLink" aria-label="分享链接" onClick={handleShareLink}>
            分享
          </button>
        </div>
      </div>

      <h1
        id="mainTitle"
        data-simplified="佛说阿弥陀经"
        data-traditional="佛說阿彌陀經"
      >
        {isTraditional ? '佛說阿彌陀經' : '佛说阿弥陀经'}
      </h1>

      <div
        id="videoCover"
        onClick={handlePlayVideo}
        style={{ display: isVideoVisible ? 'none' : 'block' }}
      >
        <img
          src="https://pub-bfae9b39b66c495c8c35815699865b03.r2.dev/1.png"
          alt="佛说阿弥陀经封面"
        />
        <p
          id="videoText"
          data-simplified="🙏 点击封面 启动佛经播放"
          data-traditional="🙏 點擊封面 啟動佛經播放"
        >
          {isTraditional ? '🙏 點擊封面 啟動佛經播放' : '🙏 点击封面 启动佛经播放'}
        </p>
      </div>

      <video
        id="amitabhaVideo"
        ref={videoRef}
        controls
        loop
        playsInline
        style={{ display: isVideoVisible ? 'block' : 'none' }}
      >
        <source
          src="https://amtb.sun.edu.my/%E4%BD%9B%E8%AA%AA%E9%98%BF%E5%BD%8C%E9%99%80%E7%B6%93.mp4"
          type="video/mp4"
        />
        您的浏览器不支持 HTML5 视频播放。
      </video>

      <div
        id="sutra"
        ref={sutraRef}
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
        dangerouslySetInnerHTML={{ __html: currentContent }}
      />

      {toastMessage && (
        <div className="share-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </>
  );
}
