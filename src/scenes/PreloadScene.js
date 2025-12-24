import Phaser from 'phaser';
import { DataManager } from '../managers/DataManager.js';

/**
 * PreloadScene - 에셋 프리로드 씬
 * 게임에 필요한 모든 에셋을 로드
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.createLoadingScreen();
    this.loadAssets();
    this.loadGameData();
  }

  async create() {
    console.log('[PreloadScene] 에셋 로딩 완료');

    // 게임 데이터 로딩 대기
    await this.dataManager.loadAllData();

    // 아이템 아이콘 로드
    this.loadItemIcons();
    
    // 스킬 아이콘 로드
    this.loadSkillIcons();
    
    // 로더를 시작하고 완료 대기 (아이템 아이콘이 큐에 있을 경우에만 동작)
    await new Promise(resolve => {
      this.load.once('complete', () => {
        // 전역 이벤트로 알림
        try { this.game.events.emit('icons:loaded'); } catch (e) {}
        resolve();
      });
      this.load.start();
    });

    // MainMenuScene으로 전환
    this.scene.start('MainMenuScene');
  }

  createLoadingScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // 타이틀
    const title = this.add.text(width / 2, height / 2 - 100, 'AETHER CHRONICLE', {
      font: 'bold 48px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // 로딩 텍스트
    const loadingText = this.add.text(width / 2, height / 2 - 20, '로딩 중...', {
      font: '20px Arial',
      fill: '#FFFFFF'
    });
    loadingText.setOrigin(0.5);

    // 진행률 텍스트
    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      font: '18px Arial',
      fill: '#FFD700'
    });
    percentText.setOrigin(0.5);

    // 로딩 바 배경
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x333333, 0.8);
    progressBox.fillRect(width / 2 - 200, height / 2 + 20, 400, 30);

    // 로딩 바
    const progressBar = this.add.graphics();

    // 로딩 이벤트 리스너
    this.load.on('progress', (value) => {
      try {
        // 퍼센트 텍스트 업데이트는 텍스처/폰트 관련 race 문제를 일으킬 수 있어 제거
        progressBar.clear();
        progressBar.fillStyle(0xFFD700, 1);
        progressBar.fillRect(width / 2 - 190, height / 2 + 25, 380 * value, 20);
      } catch (e) {
        console.warn('[PreloadScene] progress handler error', e);
      }
    });

    this.load.on('complete', () => {
      try {
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();
        percentText.destroy();
      } catch (e) {
        console.warn('[PreloadScene] complete handler error', e);
      }
    });
  }

  loadAssets() {
    // 타일맵 및 타일셋 로드
    this.load.image('grassland_tileset', 'assets/tilesets/grassland_tileset.png');
    this.load.tilemapTiledJSON('town', 'assets/tilemaps/town.json');
    this.load.tilemapTiledJSON('field', 'assets/tilemaps/field.json');

    // 화살 이미지 로드
    this.load.image('arrow', 'assets/images/projectiles/arrow.png');

    // 캐릭터 스프라이트 로드
    this.loadCharacterSprites();

    // 아이템 아이콘 로드 (DataManager가 초기화되기 전에 로드할 수 없으므로 create에서 처리)
  }

  loadGameData() {
    // DataManager 초기화
    this.dataManager = DataManager.getInstance();
  }

  loadItemIcons() {
    const items = this.dataManager.getAllItems();
    const equipments = this.dataManager.getAllEquipments();

    console.log('[PreloadScene] 아이콘 로드 시작');

    // 아이템 아이콘 로드
    items.forEach(item => {
      if (item.icon) {
        console.log(`[PreloadScene] 아이템 아이콘 로드: ${item.icon}`);
        this.load.image(item.icon, `assets/images/items/${item.icon}.png`);
      }
    });

    // 장비 아이콘 로드
    equipments.forEach(equipment => {
      if (equipment.icon) {
        console.log(`[PreloadScene] 장비 아이콘 로드: ${equipment.icon}`);
        this.load.image(equipment.icon, `assets/images/items/${equipment.icon}.png`);
      }
    });

    console.log('[PreloadScene] 아이콘 로드 완료');
  }

  /**
   * 스킬 아이콘 로드
   */
  loadSkillIcons() {
    const skills = this.dataManager.getAllSkills();

    console.log('[PreloadScene] 스킬 아이콘 로드 시작');

    // 스킬 아이콘 로드
    skills.forEach(skill => {
      const iconKey = skill.id;
      console.log(`[PreloadScene] 스킬 아이콘 로드: ${iconKey}`);
      this.load.image(iconKey, `assets/images/skills/${iconKey}.png`);
    });

    console.log('[PreloadScene] 스킬 아이콘 로드 완료');
  }

  /**
   * 캐릭터 스프라이트 로드
   */
  loadCharacterSprites() {
    // 캐릭터 스프라이트 시트 로드 (각 방향별로 8프레임)
    this.load.spritesheet('idle_down', 'assets/images/characters/IDLE/idle_down.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('idle_left', 'assets/images/characters/IDLE/idle_left.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('idle_right', 'assets/images/characters/IDLE/idle_right.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('idle_up', 'assets/images/characters/IDLE/idle_up.png', {
      frameWidth: 96, frameHeight: 80
    });

    // RUN 애니메이션
    this.load.spritesheet('run_down', 'assets/images/characters/RUN/run_down.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('run_left', 'assets/images/characters/RUN/run_left.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('run_right', 'assets/images/characters/RUN/run_right.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('run_up', 'assets/images/characters/RUN/run_up.png', {
      frameWidth: 96, frameHeight: 80
    });

    // ATTACK1 애니메이션
    this.load.spritesheet('attack1_down', 'assets/images/characters/ATTACK 1/attack1_down.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('attack1_left', 'assets/images/characters/ATTACK 1/attack1_left.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('attack1_right', 'assets/images/characters/ATTACK 1/attack1_right.png', {
      frameWidth: 96, frameHeight: 80
    });
    this.load.spritesheet('attack1_up', 'assets/images/characters/ATTACK 1/attack1_up.png', {
      frameWidth: 96, frameHeight: 80
    });
    // IDLE 애니메이션
    this.load.image('idle_down', 'assets/images/characters/IDLE/idle_down.png');
    this.load.image('idle_left', 'assets/images/characters/IDLE/idle_left.png');
    this.load.image('idle_right', 'assets/images/characters/IDLE/idle_right.png');
    this.load.image('idle_up', 'assets/images/characters/IDLE/idle_up.png');

    // RUN 애니메이션
    this.load.image('run_down', 'assets/images/characters/RUN/run_down.png');
    this.load.image('run_left', 'assets/images/characters/RUN/run_left.png');
    this.load.image('run_right', 'assets/images/characters/RUN/run_right.png');
    this.load.image('run_up', 'assets/images/characters/RUN/run_up.png');

    // ATTACK1 애니메이션
    this.load.image('attack1_down', 'assets/images/characters/ATTACK 1/attack1_down.png');
    this.load.image('attack1_left', 'assets/images/characters/ATTACK 1/attack1_left.png');
    this.load.image('attack1_right', 'assets/images/characters/ATTACK 1/attack1_right.png');
    this.load.image('attack1_up', 'assets/images/characters/ATTACK 1/attack1_up.png');

    // 몬스터 스프라이트
    this.load.spritesheet('slime', 'assets/images/characters/slime.png', {
      frameWidth: 32, frameHeight: 32
    });
    this.load.spritesheet('wolf', 'assets/images/characters/wolf.png', {
      frameWidth: 32, frameHeight: 32
    });

    // 마법사 공격 효과
    this.load.image('mage_attack', 'assets/images/characters/MageAttack.png');

    console.log('[PreloadScene] 캐릭터 스프라이트 로드 완료');
  }
}
