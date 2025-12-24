import Phaser from 'phaser';
import { fuseSkills } from '../entities/FusionLogic.js';

/**
 * FusionUI - 융합술사 스킬 융합 UI
 */
export class FusionUI {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player || null;
    this.isOpen = false;
    this.skillSelectorElements = []; // 스킬 선택기 요소들 저장

    // 융합 레시피 데이터 로드
    this.fusionRecipes = this.loadFusionRecipes();

    this.createUI();
    this.setupEvents();
  }

  /**
   * 융합 레시피 데이터 로드
   */
  loadFusionRecipes() {
    try {
      // DataManager에서 융합 레시피 로드
      if (this.scene.dataManager && typeof this.scene.dataManager.getFusionRecipes === 'function') {
        return this.scene.dataManager.getFusionRecipes();
      }
      // GameScene의 dataManager 확인
      const gameScene = this.scene.scene ? this.scene.scene.get('GameScene') : null;
      if (gameScene && gameScene.dataManager && typeof gameScene.dataManager.getFusionRecipes === 'function') {
        return gameScene.dataManager.getFusionRecipes();
      }
      // 임시 데이터 (실제로는 dataManager에서 로드)
      console.warn('[FusionUI] 융합 레시피를 로드할 수 없습니다. 임시 데이터를 사용합니다.');
      return [
        {
          ingredients: ["속성 탄환", "마력 장벽"],
          result: "fusion_magic_barrier",
          name: "마력 보호막",
          description: "마력을 실은 보호막으로 물리와 마법 공격을 모두 막음"
        },
        {
          ingredients: ["속성 탄환", "불안정한 파동"],
          result: "fusion_elemental_wave",
          name: "원소 파동",
          description: "다양한 속성의 파동을 동시에 발사하여 적을 혼란시킴"
        },
        {
          ingredients: ["마력 장벽", "불안정한 파동"],
          result: "fusion_barrier_wave",
          name: "장벽 파동",
          description: "파동을 장벽 형태로 발사하여 넓은 범위를 보호"
        }
      ];
    } catch (error) {
      console.warn('[FusionUI] 융합 레시피 로드 실패:', error);
      return [];
    }
  }

  /**
   * UI 생성
   */
  createUI() {
    // 화면 크기
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // 메인 컨테이너
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0); // 화면에 고정
    this.container.setVisible(false);

    // 배경
    const bg = this.scene.add.rectangle(0, 0, 800, 600, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(3, 0xFFD700);
    this.container.add(bg);

    // 제목
    const title = this.scene.add.text(0, -270, '🔮 원소 융합', {
      font: 'bold 28px Arial',
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 닫기 버튼
    const closeBtn = this.scene.add.text(370, -270, '✕', {
      font: 'bold 24px Arial',
      fill: '#FFFFFF'
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.setDepth(1200); // 더 높은 depth로 설정
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF0000'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FFFFFF'));
    this.container.add(closeBtn);

    // 설명 텍스트
    const desc = this.scene.add.text(0, -230,
      '두 개의 스킬을 선택하여 새로운 융합 스킬을 생성하세요.\n융합된 스킬은 영구적으로 사용할 수 있습니다.',
      {
        font: '16px Arial',
        fill: '#FFFFFF',
        align: 'center',
        wordWrap: { width: 700 }
      }
    );
    desc.setOrigin(0.5);
    this.container.add(desc);

    // 왼쪽 슬롯 (첫 번째 스킬)
    this.createSkillSlot(-250, -100, '첫 번째 스킬');
    // 오른쪽 슬롯 (두 번째 스킬)
    this.createSkillSlot(250, -100, '두 번째 스킬');

    // 결과 표시 영역
    this.createResultArea();

    // 융합 버튼
    this.fuseBtn = this.scene.add.rectangle(0, 200, 150, 50, 0x4CAF50, 0.8);
    this.fuseBtn.setStrokeStyle(2, 0xFFFFFF);
    this.fuseBtn.setInteractive({ useHandCursor: true });
    this.fuseBtn.on('pointerdown', () => this.attemptFusion());
    this.fuseBtn.on('pointerover', () => this.fuseBtn.setFillStyle(0x66BB6A, 0.9));
    this.fuseBtn.on('pointerout', () => this.fuseBtn.setFillStyle(0x4CAF50, 0.8));
    this.container.add(this.fuseBtn);

    const fuseText = this.scene.add.text(0, 200, '융합하기', {
      font: 'bold 18px Arial',
      fill: '#FFFFFF'
    });
    fuseText.setOrigin(0.5);
    this.container.add(fuseText);

    // 초기 상태 업데이트
    this.updateUI();
  }

  /**
   * 스킬 선택 슬롯 생성
   */
  createSkillSlot(x, y, label) {
    // 슬롯 배경
    const slotBg = this.scene.add.rectangle(x, y, 180, 200, 0x333333, 0.8);
    slotBg.setStrokeStyle(2, 0xFFD700);
    this.container.add(slotBg);

    // 라벨
    const slotLabel = this.scene.add.text(x, y - 90, label, {
      font: 'bold 14px Arial',
      fill: '#FFD700'
    });
    slotLabel.setOrigin(0.5);
    this.container.add(slotLabel);

    // 스킬 아이콘 영역
    const iconBg = this.scene.add.rectangle(x, y - 30, 80, 80, 0x000000, 0.5);
    this.container.add(iconBg);

    // 스킬 이름
    const nameText = this.scene.add.text(x, y + 60, '선택하세요', {
      font: '12px Arial',
      fill: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 160 }
    });
    nameText.setOrigin(0.5);
    this.container.add(nameText);

    // 슬롯 데이터 저장
    const slotKey = label === '첫 번째 스킬' ? 'first' : 'second';
    this[slotKey + 'Slot'] = {
      bg: slotBg,
      iconBg: iconBg,
      nameText: nameText,
      selectedSkill: null
    };

    // 클릭 이벤트
    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerdown', () => this.showSkillSelector(slotKey));
  }

  /**
   * 결과 표시 영역 생성
   */
  createResultArea() {
    // 결과 배경
    const resultBg = this.scene.add.rectangle(0, 50, 300, 100, 0x222222, 0.8);
    resultBg.setStrokeStyle(2, 0xFFD700);
    this.container.add(resultBg);

    // 결과 라벨
    const resultLabel = this.scene.add.text(0, 10, '융합 결과', {
      font: 'bold 16px Arial',
      fill: '#FFD700'
    });
    resultLabel.setOrigin(0.5);
    this.container.add(resultLabel);

    // 결과 이름
    this.resultNameText = this.scene.add.text(0, 35, '스킬을 선택하세요', {
      font: '14px Arial',
      fill: '#FFFFFF'
    });
    this.resultNameText.setOrigin(0.5);
    this.container.add(this.resultNameText);

    // 결과 설명
    this.resultDescText = this.scene.add.text(0, 55, '', {
      font: '12px Arial',
      fill: '#AAAAAA',
      align: 'center',
      wordWrap: { width: 280 }
    });
    this.resultDescText.setOrigin(0.5);
    this.container.add(this.resultDescText);
  }

  /**
   * 스킬 선택기 표시
   */
  showSkillSelector(slotKey) {
    // 기존 스킬 선택기 닫기
    this.closeSkillSelector();

    // 슬롯 클릭 비활성화
    this.disableSlotInteractions();

    // 현재 플레이어의 모든 스킬 목록 가져오기 (융합한 스킬 포함)
    const availableSkills = this.getAllPlayerSkills();

    if (!availableSkills || !Array.isArray(availableSkills) || availableSkills.length === 0) {
      console.log('[FusionUI] 선택 가능한 스킬이 없습니다.');
      // 간단한 알림 표시
      const notification = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, '사용 가능한 스킬이 없습니다', {
        font: '16px Arial',
        fill: '#FF0000'
      });
      notification.setOrigin(0.5);
      notification.setDepth(1200);
      this.skillSelectorElements.push(notification);
      this.scene.time.delayedCall(2000, () => {
        if (notification && notification.active) {
          notification.destroy();
        }
        // 배열에서 제거
        const index = this.skillSelectorElements.indexOf(notification);
        if (index > -1) {
          this.skillSelectorElements.splice(index, 1);
        }
      });
      return;
    }

    // 스킬 선택 UI 생성 (화면 중앙에 표시)
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const selectorBg = this.scene.add.rectangle(centerX, centerY, 400, 300, 0x000000, 0.9);
    selectorBg.setStrokeStyle(2, 0xFFD700);
    selectorBg.setDepth(1300); // 더 높은 depth로 설정
    selectorBg.setScrollFactor(0); // 화면에 고정
    this.skillSelectorElements.push(selectorBg);

    const selectorTitle = this.scene.add.text(centerX, centerY - 130, '스킬 선택', {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    selectorTitle.setOrigin(0.5);
    selectorTitle.setDepth(1301); // 더 높은 depth로 설정
    selectorTitle.setScrollFactor(0); // 화면에 고정
    this.skillSelectorElements.push(selectorTitle);

    // 스킬 버튼들 생성
    if (Array.isArray(availableSkills)) {
      availableSkills.forEach((skill, index) => {
      const btnY = centerY - 80 + (index * 40);
      const skillBtn = this.scene.add.rectangle(centerX - 5, btnY, 300, 35, 0x333333, 0.8);
      skillBtn.setStrokeStyle(1, 0xFFFFFF);
      skillBtn.setInteractive({ useHandCursor: true });
      skillBtn.setDepth(1300); // 더 높은 depth로 설정
      skillBtn.setScrollFactor(0); // 화면에 고정

      const skillText = this.scene.add.text(centerX - 5, btnY, skill.name, {
        font: '14px Arial',
        fill: '#FFFFFF'
      });
      skillText.setOrigin(0.5);
      skillText.setDepth(1301); // 더 높은 depth로 설정
      skillText.setScrollFactor(0); // 화면에 고정

      skillBtn.on('pointerdown', () => {
        this.selectSkillForSlot(slotKey, skill);
        this.closeSkillSelector();
      });

      skillBtn.on('pointerover', () => skillBtn.setFillStyle(0x555555, 0.9));
      skillBtn.on('pointerout', () => skillBtn.setFillStyle(0x333333, 0.8));

      this.skillSelectorElements.push(skillBtn);
      this.skillSelectorElements.push(skillText);
    });
    } else {
      console.warn('[FusionUI] availableSkills가 배열이 아닙니다:', availableSkills);
    }

    // 닫기 버튼
    const closeSelectorBtn = this.scene.add.text(centerX + 180, centerY - 130, '✕', {
      font: 'bold 20px Arial',
      fill: '#FFFFFF'
    });
    closeSelectorBtn.setOrigin(0.5);
    closeSelectorBtn.setInteractive({ useHandCursor: true });
    closeSelectorBtn.setDepth(1301); // 더 높은 depth로 설정
    closeSelectorBtn.setScrollFactor(0); // 화면에 고정
    closeSelectorBtn.on('pointerdown', () => {
      this.closeSkillSelector();
    });
    this.skillSelectorElements.push(closeSelectorBtn);

    // 모든 요소가 이미 씬에 추가됨
  }

  /**
   * 플레이어의 모든 스킬 목록 가져오기 (기본 스킬 + 융합 스킬)
   */
  getAllPlayerSkills() {
    const skills = [];

    try {
      // 1. 기존 보유 스킬 (retainedSkills - 마법사 스킬)
      if (this.player && this.player.retainedSkills && Array.isArray(this.player.retainedSkills)) {
        this.player.retainedSkills.forEach(skill => {
          if (skill && typeof skill === 'object' && skill.name && skill.id) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee'
            });
          }
        });
      }

      // 2. 현재 융합술사 스킬 (기본 스킬들 강제 포함)
      if (this.player && this.player.characterClass === 'fusionist') {
        const fusionistSkills = [
          { id: 'fusionist_base_1', name: '속성 탄환', description: '선택한 기본 속성(화염, 냉기, 전격) 탄환 발사, 110% 피해', type: 'projectile' },
          { id: 'fusionist_barrier', name: '마력 장벽', description: '2초간 전방의 투사체를 막고 100% 피해 흡수', type: 'barrier' },
          { id: 'fusionist_wave', name: '불안정한 파동', description: '주변 적을 밀쳐내며 130% 피해, 융합 재료로 사용 시 효율 증가', type: 'aoe' },
          { id: 'fusionist_ultimate', name: '원소 융합', description: '[전용 UI 오픈] 슬롯에 장착된 스킬 2개를 조합하여 새로운 스킬 생성', type: 'system' }
        ];

        fusionistSkills.forEach(skill => {
          if (!skills.some(s => s.id === skill.id)) {
            skills.push(skill);
          }
        });
      }

      // 3. 융합해서 만든 새로운 스킬들
      if (this.player && this.player.fusionSkills && Array.isArray(this.player.fusionSkills)) {
        this.player.fusionSkills.forEach(skill => {
          if (skill && skill.name && skill.id && !skills.some(s => s.id === skill.id)) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'fusion'
            });
          }
        });
      }

      // 4. 현재 장착된 스킬들도 포함 (중복 방지)
      if (this.player && this.player.skills && typeof this.player.skills === 'object') {
        Object.values(this.player.skills).forEach(skill => {
          if (skill && skill.name && skill.id && !skills.some(s => s.id === skill.id)) {
            skills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              type: skill.type || 'melee'
            });
          }
        });
      }

    } catch (error) {
      console.warn('[FusionUI] 스킬 로드 중 오류:', error);
    }

    console.log('[FusionUI] 모든 스킬 결과:', skills);
    return skills;
  }

  /**
   * 스킬 선택
   */
  selectSkill(slotKey, skill) {
    const slot = this[slotKey + 'Slot'];
    slot.selectedSkill = skill;
    slot.nameText.setText(skill.name);
    slot.nameText.setColor('#FFFFFF');

    // 결과 업데이트
    this.updateFusionResult();
  }

  /**
   * 융합 결과 업데이트
   */
  updateFusionResult() {
    const firstSkill = this.firstSlot.selectedSkill;
    const secondSkill = this.secondSlot.selectedSkill;

    if (!firstSkill || !secondSkill) {
      this.resultNameText.setText('두 스킬을 모두 선택하세요');
      this.resultDescText.setText('');
      return;
    }

    // 융합 레시피 찾기
    const recipe = this.findFusionRecipe(firstSkill.name, secondSkill.name);

    if (recipe) {
      this.resultNameText.setText(recipe.name);
      this.resultDescText.setText(recipe.description);
      this.resultNameText.setColor('#FFD700');
    } else {
      this.resultNameText.setText('융합 불가능');
      this.resultDescText.setText('선택한 스킬 조합으로는 융합할 수 없습니다.');
      this.resultNameText.setColor('#FF6B6B');
    }
  }

  /**
   * 융합 레시피 찾기
   */
  findFusionRecipe(skill1Name, skill2Name) {
    return this.fusionRecipes.find(recipe => {
      const ingredients = recipe.ingredients;
      return (ingredients.includes(skill1Name) && ingredients.includes(skill2Name));
    });
  }

  /**
   * 융합 시도
   */
  attemptFusion() {
    const firstSkill = this.firstSlot.selectedSkill;
    const secondSkill = this.secondSlot.selectedSkill;

    if (!firstSkill || !secondSkill) {
      console.log('[FusionUI] 두 스킬을 모두 선택해야 합니다.');
      return;
    }
// FusionLogic을 사용하여 스킬 융합
    const fusedSkill = fuseSkills(firstSkill, secondSkill);
    
    if (!fusedSkill) {
      console.log('[FusionUI] 융합에 실패했습니다.');
      return;
    }

    // 융합 실행 (불완전 융합도 허용)
    this.performFusion(fusedSkill);
  }

  /**
   * 융합 실행
   */
  performFusion(fusedSkill) {
    console.log('[FusionUI] 융합 실행:', fusedSkill.name);

    // 플레이어의 스킬에 추가
    if (!this.player.fusionSkills) {
      this.player.fusionSkills = [];
    }
    this.player.fusionSkills.push(fusedSkill);

    // 성공 메시지
    const successText = this.scene.add.text(0, 250, `🎉 ${fusedSkill.name} 스킬 생성 완료!`, {
      font: 'bold 20px Arial',
      fill: '#FFD700'
    });
    successText.setDepth(1100);

    // 2초 후 사라짐
    this.scene.time.delayedCall(2000, () => {
      successText.destroy();
    });

    // UI 초기화
    this.clearSelection();
  }

  /**
   * 선택 초기화
   */
  clearSelection() {
    this.firstSlot.selectedSkill = null;
    this.firstSlot.nameText.setText('선택하세요');
    this.firstSlot.nameText.setColor('#AAAAAA');

    this.secondSlot.selectedSkill = null;
    this.secondSlot.nameText.setText('선택하세요');
    this.secondSlot.nameText.setColor('#AAAAAA');

    this.resultNameText.setText('스킬을 선택하세요');
    this.resultDescText.setText('');
  }

  /**
   * UI 업데이트
   */
  updateUI() {
    this.updateFusionResult();
  }

  /**
   * 이벤트 설정
   */
  setupEvents() {
    // ESC 키로 닫기
    this.scene.input.keyboard.on('keydown-ESC', () => {
      if (this.isOpen) {
        this.hide();
      }
    });

    // R 키로 스킬 선택기 닫기
    this.scene.input.keyboard.on('keydown-R', () => {
      if (this.isOpen && this.skillSelectorElements.length > 0) {
        this.closeSkillSelector();
      }
    });

    // K 키 이벤트는 GameScene에서 처리하므로 여기서는 제거
  }

  /**
   * 슬롯에 스킬 선택
   */
  selectSkillForSlot(slotKey, skill) {
    const slot = slotKey === 'first' ? this.firstSlot : this.secondSlot;
    if (!slot) return;

    slot.selectedSkill = skill;
    slot.nameText.setText(skill.name);
    slot.nameText.setColor('#FFFFFF');

    // 결과 업데이트
    this.updateFusionResult();
  }

  /**
   * 표시
   */
  show() {
    // 플레이어 위치에 창 위치 설정
    if (this.player) {
      const camera = this.scene.cameras.main;
      const cameraX = this.player.x - camera.scrollX;
      const cameraY = this.player.y - camera.scrollY;
      this.container.setPosition(cameraX, cameraY);
    }
    
    this.container.setVisible(true);
    this.isOpen = true;
    this.clearSelection();
    this.updateUI();
  }

  /**
   * 숨김
   */
  hide() {
    this.container.setVisible(false);
    this.isOpen = false;
    // 스킬 선택기도 닫기
    this.closeSkillSelector();
  }

  /**
   * 토글
   */
  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 스킬 선택기 닫기
   */
  closeSkillSelector() {
    this.skillSelectorElements.forEach(element => {
      if (element && element.active) {
        element.destroy();
      }
    });
    this.skillSelectorElements = [];
    
    // 슬롯 클릭 다시 활성화
    this.enableSlotInteractions();
  }

  /**
   * 슬롯 클릭 비활성화
   */
  disableSlotInteractions() {
    if (this.firstSlot && this.firstSlot.bg) {
      this.firstSlot.bg.disableInteractive();
    }
    if (this.secondSlot && this.secondSlot.bg) {
      this.secondSlot.bg.disableInteractive();
    }
  }

  /**
   * 슬롯 클릭 활성화
   */
  enableSlotInteractions() {
    if (this.firstSlot && this.firstSlot.bg) {
      this.firstSlot.bg.setInteractive({ useHandCursor: true });
    }
    if (this.secondSlot && this.secondSlot.bg) {
      this.secondSlot.bg.setInteractive({ useHandCursor: true });
    }
  }

  /**
   * 스킬 선택기가 열려있는지 확인
   */
  hasSkillSelectorOpen() {
    return this.skillSelectorElements && this.skillSelectorElements.length > 0;
  }

  /**
   * UI 업데이트 (플레이어 위치에 고정)
   */
  update() {
    if (this.isOpen && this.player) {
      const camera = this.scene.cameras.main;
      const cameraX = this.player.x - camera.scrollX;
      const cameraY = this.player.y - camera.scrollY;
      this.container.setPosition(cameraX, cameraY);
    }

    // 스킬 선택기 위치 업데이트
    if (this.skillSelectorElements && this.skillSelectorElements.length > 0 && this.player) {
      const camera = this.scene.cameras.main;
      const centerX = this.player.x - camera.scrollX;
      const centerY = this.player.y - camera.scrollY;

      // 각 요소의 상대 위치 유지하면서 업데이트
      this.skillSelectorElements.forEach((element, index) => {
        if (element && element.active) {
          // 첫 번째 요소는 배경 (중앙)
          if (index === 0) {
            element.setPosition(centerX, centerY);
          }
          // 두 번째 요소는 제목
          else if (index === 1) {
            element.setPosition(centerX, centerY - 130);
          }
          // 나머지 요소들은 상대 위치 계산 필요
          // 간단히 중앙으로 설정 (정확한 위치 조정 필요)
          else {
            const originalX = element.x;
            const originalY = element.y;
            const offsetX = originalX - (this.scene.cameras.main.width / 2);
            const offsetY = originalY - (this.scene.cameras.main.height / 2);
            element.setPosition(centerX + offsetX, centerY + offsetY);
          }
        }
      });
    }
  }
}