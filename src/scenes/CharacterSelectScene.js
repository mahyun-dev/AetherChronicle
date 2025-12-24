import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig.js';

/**
 * CharacterSelectScene - 캐릭터 클래스 선택 씬
 */
export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 타이틀
    const title = this.add.text(width / 2, height / 4, '직업 선택', {
      font: 'bold 48px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // 클래스 정보
    this.classes = [
      {
        key: GameConfig.CLASSES.WARRIOR,
        name: '전사',
        description: '강력한 근접 공격과 방어력이 뛰어남\n높은 HP와 공격력',
        color: 0xFF6B6B,
        skills: ['돌진 베기', '방어 자세', '회전 베기', '파멸의 일격']
      },
      {
        key: GameConfig.CLASSES.MAGE,
        name: '마법사',
        description: '강력한 마법 공격과 광역 스킬\n높은 MP와 마법 피해',
        color: 0x4ECDC4,
        skills: ['마력탄', '화염 폭발', '냉기 파동', '시간 왜곡']
      },
      {
        key: GameConfig.CLASSES.ARCHER,
        name: '궁수',
        description: '빠른 원거리 공격과 기동성\n높은 이동 속도와 치명타',
        color: 0x45B7D1,
        skills: ['관통 화살', '후퇴 사격', '독화살', '폭풍우 화살']
      },
      {
        key: GameConfig.CLASSES.ROGUE,
        name: '도적',
        description: '민첩한 암살과 독 공격\n높은 회피율과 은신 능력',
        color: 0x96CEB4,
        skills: ['그림자 밟기', '연막탄', '독 폭탄', '암살자의 춤']
      },
      {
        key: 'fusionist',
        name: '융합술사',
        description: '스킬 융합과 강력한 조합 공격\n기존 스킬 보존 및 융합 생성',
        color: 0xFF8C00,
        skills: ['융합 베리어', '융합 파동', '융합 폭발', '궁극의 융합']
      }
    ];

    // 클래스 선택 버튼들
    this.createClassButtons();

    // 선택된 클래스 표시 영역
    this.selectedClass = null;
    this.createClassInfoPanel();

    // 시작 버튼 (처음에는 비활성화)
    this.startButton = this.createButton(width / 2, height - 100, '게임 시작', () => {
      this.startGame();
    });
    this.startButton.button.setVisible(false);
    this.startButton.buttonText.setVisible(false);

    // 뒤로가기 버튼
    this.createButton(width / 2, height - 50, '뒤로가기', () => {
      this.scene.start('MainMenuScene');
    });
  }

  createClassButtons() {
    const width = this.cameras.main.width;
    const startY = this.cameras.main.height / 3;
    const buttonWidth = 250;
    const buttonHeight = 60;
    const spacing = 20;

    this.classes.forEach((classData, index) => {
      const x = width / 2;
      const y = startY + index * (buttonHeight + spacing);

      // 버튼 배경
      const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, classData.color);
      button.setStrokeStyle(3, 0xFFD700);
      button.setInteractive({ useHandCursor: true });

      // 버튼 텍스트
      const buttonText = this.add.text(x, y, classData.name, {
        font: 'bold 24px Arial',
        fill: '#FFFFFF'
      });
      buttonText.setOrigin(0.5);

      // 호버 효과
      button.on('pointerover', () => {
        button.setScale(1.05);
        buttonText.setColor('#FFD700');
      });

      button.on('pointerout', () => {
        button.setScale(1);
        buttonText.setColor('#FFFFFF');
      });

      button.on('pointerdown', () => {
        this.selectClass(classData);
      });

      // 클래스 데이터 저장
      button.classData = classData;
    });
  }

  createClassInfoPanel() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const panelWidth = 400;
    const panelHeight = 200;
    const panelX = width - panelWidth / 2 - 50;
    const panelY = height / 2;

    // 패널 배경
    this.infoPanel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x333333);
    this.infoPanel.setStrokeStyle(2, 0xFFD700);

    // 클래스 이름
    this.classNameText = this.add.text(panelX, panelY - 80, '', {
      font: 'bold 28px Arial',
      fill: '#FFD700'
    });
    this.classNameText.setOrigin(0.5);

    // 설명
    this.classDescText = this.add.text(panelX, panelY - 20, '', {
      font: '16px Arial',
      fill: '#CCCCCC',
      align: 'center'
    });
    this.classDescText.setOrigin(0.5);

    // 스킬 목록
    this.skillListText = this.add.text(panelX, panelY + 40, '', {
      font: '14px Arial',
      fill: '#AAAAAA',
      align: 'center'
    });
    this.skillListText.setOrigin(0.5);
  }

  selectClass(classData) {
    this.selectedClass = classData;

    // 정보 패널 업데이트
    this.classNameText.setText(classData.name);
    this.classDescText.setText(classData.description);
    this.skillListText.setText('스킬: ' + classData.skills.join(', '));

    // 시작 버튼 활성화
    this.startButton.button.setVisible(true);
    this.startButton.buttonText.setVisible(true);
  }

  createButton(x, y, text, callback) {
    // 버튼 배경
    const button = this.add.rectangle(x, y, 200, 40, 0x333333);
    button.setStrokeStyle(2, 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    // 버튼 텍스트
    const buttonText = this.add.text(x, y, text, {
      font: 'bold 18px Arial',
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

  startGame() {
    if (!this.selectedClass) return;

    // 선택된 클래스를 게임 데이터에 저장 (임시로 registry 사용)
    this.registry.set('selectedClass', this.selectedClass.key);

    // 게임 씬 시작
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}