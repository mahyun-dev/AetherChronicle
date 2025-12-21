import { fuseSkills } from '../entities/FusionLogic.js';

export default class FusionWindow {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player; // 플레이어 객체
    this.selectedA = null;
    this.selectedB = null;
    this.resultSkill = null;
    this.isOpen = false;
    this.container = null;
    this.skillSelector = null;
    this.leftSkillText = null;
    this.rightSkillText = null;
    this.resultSkillText = null;
    this.resultDescText = null;
  }

  /**
   * UI 열기/닫기 토글
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) {
      this.close();
      this.open();
      return;
    }
    this.isOpen = true;
    this.create();
  }

  /**
   * UI 닫기
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    if (this.skillSelector) {
      this.skillSelector.destroy();
      this.skillSelector = null;
    }
    // 텍스트 참조 정리
    this.leftSkillText = null;
    this.rightSkillText = null;
    this.resultSkillText = null;
    this.resultDescText = null;
  }

  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // 컨테이너 생성
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(true);

    // 융합 창 배경 - 화면 중앙에 위치
    const panelWidth = 600;
    const panelHeight = 400;
    const panelX = width / 2;  // 화면 중앙 X
    const panelY = height / 2; // 화면 중앙 Y

    // 배경 패널
    const background = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x000000, 0.9);
    background.setStrokeStyle(2, 0xffffff);
    background.setAlpha(1.0);
    this.container.add(background);

    // 타이틀
    const title = this.scene.add.text(panelX, panelY - panelHeight/2 + 30, '스킬 융합', {
      fontSize: '24px',
      color: '#ffffff'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 좌측 슬롯
    const leftSlotX = panelX - 150;
    const slotY = panelY;
    const leftSlot = this.scene.add.rectangle(leftSlotX, slotY, 120, 120, 0x333333);
    leftSlot.setStrokeStyle(2, 0xffffff);
    this.container.add(leftSlot);

    // 우측 슬롯
    const rightSlotX = panelX + 150;
    const rightSlot = this.scene.add.rectangle(rightSlotX, slotY, 120, 120, 0x333333);
    rightSlot.setStrokeStyle(2, 0xffffff);
    this.container.add(rightSlot);

    const rightLabel = this.scene.add.text(rightSlotX, slotY - 70, '스킬 B', {
      fontSize: '16px',
      color: '#ffffff'
    });
    rightLabel.setOrigin(0.5);
    this.container.add(rightLabel);

    // 결과 슬롯
    const resultSlot = this.scene.add.rectangle(panelX, slotY, 120, 120, 0x333333);
    resultSlot.setStrokeStyle(2, 0xffffff);
    this.container.add(resultSlot);

    const resultLabel = this.scene.add.text(panelX, slotY - 70, '결과', {
      fontSize: '16px',
      color: '#ffffff'
    });
    resultLabel.setOrigin(0.5);
    this.container.add(resultLabel);

    // 좌측 슬롯 클릭 이벤트
    leftSlot.setInteractive({ useHandCursor: true });
    leftSlot.on('pointerover', () => console.log('[FusionWindow] 좌측 슬롯 호버'));
    leftSlot.on('pointerdown', () => {
      console.log('[FusionWindow] 좌측 슬롯 클릭됨');
      this.showSkillSelector('left');
    });

    // 우측 슬롯 클릭 이벤트
    rightSlot.setInteractive({ useHandCursor: true });
    rightSlot.on('pointerover', () => console.log('[FusionWindow] 우측 슬롯 호버'));
    rightSlot.on('pointerdown', () => {
      console.log('[FusionWindow] 우측 슬롯 클릭됨');
      this.showSkillSelector('right');
    });

    // 결과 슬롯은 클릭 불가 (표시용)
    // resultSlot.setInteractive();
    // resultSlot.on('pointerdown', () => this.showSkillSelector('result'));

    // 융합 버튼
    const fuseButton = this.scene.add.rectangle(panelX, panelY + 120, 120, 40, 0x444444);
    fuseButton.setStrokeStyle(1, 0xffffff);
    fuseButton.setInteractive();
    fuseButton.on('pointerdown', () => this.confirmFusion());
    this.container.add(fuseButton);

    const fuseText = this.scene.add.text(panelX, panelY + 120, '융합하기', {
      fontSize: '16px',
      color: '#ffffff'
    });
    fuseText.setOrigin(0.5);
    this.container.add(fuseText);

    // 닫기 버튼 (X)
    const closeButton = this.scene.add.text(panelX + panelWidth/2 - 20, panelY - panelHeight/2 + 20, 'X', {
      fontSize: '20px',
      color: '#ffffff'
    });
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => this.close());
    this.container.add(closeButton);

    // 초기 슬롯 표시
    this.renderSlots();
    this.renderResult();
  }

  selectSkill(slot, skill) {
    if (slot === 'left') this.selectedA = skill;
    else if (slot === 'right') this.selectedB = skill;
    this.updateResult();
    this.renderSlots(); // 슬롯 표시 갱신
  }

  renderSlots() {
    // 기존 텍스트 제거
    if (this.leftSkillText) this.leftSkillText.destroy();
    if (this.rightSkillText) this.rightSkillText.destroy();

    const panelX = this.scene.cameras.main.width / 2;
    const slotY = this.scene.cameras.main.height / 2;

    // 좌측 슬롯 텍스트
    if (this.selectedA) {
      this.leftSkillText = this.scene.add.text(panelX - 150, slotY, this.selectedA.name, {
        fontSize: '12px',
        color: '#ffffff'
      });
      this.leftSkillText.setOrigin(0.5);
      this.container.add(this.leftSkillText);
    }

    // 우측 슬롯 텍스트
    if (this.selectedB) {
      this.rightSkillText = this.scene.add.text(panelX + 150, slotY, this.selectedB.name, {
        fontSize: '12px',
        color: '#ffffff'
      });
      this.rightSkillText.setOrigin(0.5);
      this.container.add(this.rightSkillText);
    }
  }

  updateResult() {
    if (this.selectedA && this.selectedB) {
      // FusionLogic 활용
      this.resultSkill = fuseSkills(this.selectedA, this.selectedB);
      // 결과창 갱신
      this.renderResult();
    }
  }

  renderResult() {
    // 기존 결과 텍스트 제거
    if (this.resultSkillText) this.resultSkillText.destroy();
    if (this.resultDescText) this.resultDescText.destroy();

    if (this.resultSkill) {
      const panelX = this.scene.cameras.main.width / 2;
      const slotY = this.scene.cameras.main.height / 2;

      // 결과 스킬 이름
      this.resultSkillText = this.scene.add.text(panelX, slotY, this.resultSkill.name, {
        fontSize: '12px',
        color: '#ffff00'
      });
      this.resultSkillText.setOrigin(0.5);
      this.container.add(this.resultSkillText);

      // 결과 설명 (슬롯 아래에 표시)
      this.resultDescText = this.scene.add.text(panelX, slotY + 60, this.resultSkill.description, {
        fontSize: '10px',
        color: '#cccccc',
        wordWrap: { width: 200 }
      });
      this.resultDescText.setOrigin(0.5);
      this.container.add(this.resultDescText);
    }
  }

  confirmFusion() {
    // 마나/재화 소모 및 최종 스킬 획득 처리
    if (this.resultSkill) {
      console.log('스킬 융합 실행:', this.resultSkill);

      const player = this.player;
      if (player) {
        // 융합된 스킬을 새로운 슬롯에 추가 (fusion_1, fusion_2 등)
        let fusionSlotKey = 'fusion_1';
        let counter = 1;
        while (player.skills[fusionSlotKey]) {
          counter++;
          fusionSlotKey = `fusion_${counter}`;
        }

        // 스킬 인스턴스 생성
        const fusedSkillInstance = player.createSkillInstance(this.resultSkill);
        player.skills[fusionSlotKey] = fusedSkillInstance;

        console.log(`[FusionWindow] 융합 스킬 추가됨: ${fusionSlotKey} - ${this.resultSkill.name}`);

        // UI 갱신 (스킬 UI가 있다면)
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.skillUI) {
          uiScene.skillUI.updateSkillSlots();
        }

        // 융합 성공 시 R 스킬 쿨타임 적용
        if (player.skills && player.skills['R']) {
          const rSkill = player.skills['R'];
          rSkill.currentCooldown = rSkill.cooldown; // 쿨타임 적용
          console.log('[FusionWindow] R 스킬 쿨타임 적용:', rSkill.cooldown);
        }

        // 선택 초기화
        this.selectedA = null;
        this.selectedB = null;
        this.renderSlots();
        this.renderResult();

        // 성공 메시지 표시 (초기화 전에 호출)
        this.showFusionSuccess(this.resultSkill.name);
        
        this.resultSkill = null;
      }

      // 창 닫기
      this.close();
    }
  }

  showFusionSuccess(skillName) {
    // 간단한 성공 메시지 표시
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const successText = this.scene.add.text(width / 2, height / 2, `융합 성공!\n${skillName} 획득!`, {
      fontSize: '20px',
      color: '#00ff00',
      align: 'center'
    });
    successText.setOrigin(0.5);
    successText.setDepth(1200);

    // 2초 후 사라짐
    this.scene.time.delayedCall(2000, () => {
      successText.destroy();
    });
  }

  showSkillSelector(slot) {
    console.log('[FusionWindow] showSkillSelector 호출됨, slot:', slot);
    if (this.skillSelector) {
      this.skillSelector.destroy();
    }

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    this.skillSelector = this.scene.add.container(width/2, height/2);
    this.skillSelector.setDepth(2100);
    
    // 배경
    const bg = this.scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.95);
    bg.setStrokeStyle(2, 0xffffff);
    this.skillSelector.add(bg);
    
    // 타이틀
    const title = this.scene.add.text(0, -130, '스킬 선택', {
      fontSize: '20px',
      color: '#ffffff'
    });
    title.setOrigin(0.5);
    this.skillSelector.add(title);
    
    // 닫기 버튼
    const closeBtn = this.scene.add.text(180, -130, 'X', {
      fontSize: '20px',
      color: '#ffffff'
    });
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => {
      this.skillSelector.destroy();
      this.skillSelector = null;
    });
    this.skillSelector.add(closeBtn);
    
    // 보유 스킬 표시 (모든 스킬 표시)
    const player = this.player;
    if (player && player.skills) {
      const skillKeys = Object.keys(player.skills).filter(key => {
        const skill = player.skills[key];
        return skill && skill.name; // 유효한 스킬만 표시
      });
      
      let yPos = -80;
      
      skillKeys.forEach(key => {
        const skill = player.skills[key];
        if (skill) {
          const skillBtn = this.scene.add.rectangle(0, yPos, 350, 40, 0x444444);
          skillBtn.setStrokeStyle(1, 0xffffff);
          skillBtn.setInteractive();
          skillBtn.on('pointerdown', () => {
            this.selectSkill(slot, skill);
            this.skillSelector.destroy();
            this.skillSelector = null;
          });
          this.skillSelector.add(skillBtn);
          
          const skillText = this.scene.add.text(0, yPos, `${key}: ${skill.name}`, {
            fontSize: '16px',
            color: '#ffffff'
          });
          skillText.setOrigin(0.5);
          this.skillSelector.add(skillText);
          
          yPos += 50;
        }
      });
    }
  }
}
