import Phaser from 'phaser';

/**
 * BootScene - 게임 초기 부팅 씬
 * 가장 먼저 실행되는 씬으로, 최소한의 초기화만 수행
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 로딩 바 표시를 위한 간단한 그래픽
    this.createLoadingScreen();
  }

  create() {
    
    // PreloadScene으로 전환
    this.scene.start('PreloadScene');
  }

  createLoadingScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 로딩 텍스트
    const loadingText = this.add.text(width / 2, height / 2 - 50, '부팅 중...', {
      font: '24px Arial',
      fill: '#FFD700'
    });
    loadingText.setOrigin(0.5, 0.5);

    // 로딩 바 배경
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);

    // 로딩 바
    const progressBar = this.add.graphics();

    // 로딩 진행률 표시
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xFFD700, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
}
