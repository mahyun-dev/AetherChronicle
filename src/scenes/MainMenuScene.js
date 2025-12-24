import Phaser from 'phaser';

/**
 * MainMenuScene - 메인 메뉴 씬
 * 새 게임, 이어하기, 설정 등
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1e);

    // 타이틀
    const title = this.add.text(width / 2, height / 3, 'AETHER CHRONICLE', {
      font: 'bold 64px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 8
    });
    title.setOrigin(0.5);

    // 부제목
    const subtitle = this.add.text(width / 2, height / 3 + 60, '2D 오픈월드 액션 RPG', {
      font: '20px Arial',
      fill: '#CCCCCC'
    });
    subtitle.setOrigin(0.5);

    // 버튼들
    this.createButton(width / 2, height / 2 + 50, '새 게임', () => {
      this.startNewGame();
    });

    this.createButton(width / 2, height / 2 + 130, '이어하기', () => {
      this.continueGame();
    });

    this.createButton(width / 2, height / 2 + 210, '설정', () => {
      console.log('설정 메뉴 (구현 예정)');
    });

    // 버전 표시
    this.add.text(10, height - 30, 'v0.1.0 - Phase 1 프로토타입', {
      font: '14px Arial',
      fill: '#666666'
    });

    // 크레딧
    this.add.text(width - 10, height - 30, 'by mahyun-dev', {
      font: '14px Arial',
      fill: '#666666'
    }).setOrigin(1, 0);
  }

  createButton(x, y, text, callback) {
    // 버튼 배경
    const button = this.add.rectangle(x, y, 300, 50, 0x333333);
    button.setStrokeStyle(2, 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    // 버튼 텍스트
    const buttonText = this.add.text(x, y, text, {
      font: 'bold 24px Arial',
      fill: '#FFFFFF'
    });
    buttonText.setOrigin(0.5);

    // 호버 효과
    button.on('pointerover', () => {
      button.setFillStyle(0x444444);
      buttonText.setColor('#FFD700');
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x333333);
      buttonText.setColor('#FFFFFF');
    });

    button.on('pointerdown', () => {
      button.setFillStyle(0x222222);
    });

    button.on('pointerup', () => {
      button.setFillStyle(0x444444);
      callback();
    });

    return { button, buttonText };
  }

  startNewGame() {
    console.log('[MainMenuScene] 새 게임 시작');
    
    // 캐릭터 선택 씬으로 이동
    this.scene.start('CharacterSelectScene');
  }

  continueGame() {
    console.log('[MainMenuScene] 이어하기');
    
    // TODO: 저장 데이터 확인 및 로드
    const hasSaveData = false; // 임시
    
    if (hasSaveData) {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    } else {
      console.log('저장된 데이터가 없습니다.');
    }
  }
}
