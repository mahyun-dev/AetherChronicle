import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Slime, Wolf, Goblin, GoblinWarrior, Harpy, Ogre, GoldenGryphon } from '../entities/Monster.js';
import { DroppedItem, Item } from '../entities/Item.js';
import { DataManager } from '../managers/DataManager.js';

/**
 * GameScene - 메인 게임플레이 씬
 * 플레이어, 몬스터, 맵 등 핵심 게임 로직
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // 현재 맵
    this.currentMap = 'town';
    this.currentMapName = 'town';
  }

  create() {
    console.log('[GameScene] 게임 시작');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // DataManager 초기화
    this.dataManager = DataManager.getInstance();

    // 타일맵 로드
    this.loadTilemap(this.currentMap);

    // 플레이어 생성 (선택된 클래스 사용)
    const selectedClass = this.registry.get('selectedClass') || 'warrior';
    this.player = new Player(this, width / 2, height / 2, selectedClass);

    // 카메라가 플레이어를 따라가도록 설정
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // UIScene에 플레이어 전달
    console.log('[GameScene] player:ready 이벤트 발생, player:', this.player);
    this.events.emit('player:ready', this.player);

    // UIScene을 직접 가져와서 setPlayer 호출 (이벤트가 안될 경우 대비)
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.setPlayer) {
      console.log('[GameScene] UIScene.setPlayer 직접 호출');
      uiScene.setPlayer(this.player);
    }

    // 몬스터 그룹 생성
    this.monsters = this.add.group();
    this.spawnMonsters();

    // 드롭 아이템 그룹
    this.droppedItems = this.add.group();

    // 충돌 설정
    this.setupCollisions();

    // 플레이어와 타일맵 충돌 설정
    this.setupPlayerCollision();

    // 이벤트 설정
    this.setupEvents();

    // 입력 설정 (ESC만, 나머지는 Player 클래스에서 처리)
    this.setupInput();
  }

  /**
   * 입력 설정
   */
  setupInput() {
    // ESC 키 - UI 닫기 또는 설정창 열기/닫기
    this.input.keyboard.on('keydown-ESC', () => {
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        // 설정창이 열려있으면 닫기
        if (this.settingsMenu) {
          this.hideSettingsMenu();
          console.log('[GameScene] ESC - 설정창 닫기');
          return;
        }

        // 열려있는 UI를 순서대로 확인하고 닫기
        if (uiScene.inventoryUI && uiScene.inventoryUI.isOpen) {
          uiScene.inventoryUI.close();
          console.log('[GameScene] ESC - 인벤토리 닫기');
        } else if (uiScene.equipmentUI && uiScene.equipmentUI.container && uiScene.equipmentUI.container.visible) {
          uiScene.equipmentUI.hide();
          console.log('[GameScene] ESC - 장비창 닫기');
        } else if (uiScene.enhancementUI && uiScene.enhancementUI.isOpen) {
          uiScene.enhancementUI.hide();
          console.log('[GameScene] ESC - 강화창 닫기');
        } else if (uiScene.questUI && uiScene.questUI.isOpen) {
          uiScene.questUI.close();
          console.log('[GameScene] ESC - 퀘스트창 닫기');
        } else {
          // 열려있는 UI가 없으면 설정창 열기
          this.showSettingsMenu();
          console.log('[GameScene] ESC - 설정창 열기');
        }
      }
    });
  }

  update(time, delta) {
    if (!this.player) return;

    // 플레이어 업데이트
    this.player.update(time, delta);

    // 몬스터 업데이트
    this.monsters.getChildren().forEach(monster => {
      if (monster.update) {
        monster.update(time, delta);
      }
    });

    // 투사체 충돌 체크
    this.checkProjectileCollisions();

    // 아이템 습득 체크
    this.checkItemPickup();

    // 포탈 충돌 체크
    this.checkPortalCollision();
  }

  /**
   * 이벤트 설정
   */
  setupEvents() {
    // 아이템 드롭 이벤트
    this.events.on('item:drop', (data) => {
      this.dropItem(data.itemId, data.x, data.y, data.quantity);
    });
  }

  /**
   * 아이템 드롭
   */
  dropItem(itemId, x, y, quantity = 1) {
    console.log(`[GameScene] 아이템 드롭 시도: ${itemId} x${quantity}`);

    const itemData = this.dataManager.getItem(itemId);
    if (!itemData) {
      console.warn(`아이템을 찾을 수 없음: ${itemId}`);
      console.log('사용 가능한 아이템:', this.dataManager.getAllItems().map(i => i.id));
      return;
    }

    console.log(`[GameScene] 아이템 드롭 성공: ${itemData.name}`);

    // 아이템 객체 생성
    const item = new Item(itemData);
    item.quantity = quantity;

    // 드롭된 아이템 생성 (약간 랜덤한 위치)
    const offsetX = Phaser.Math.Between(-20, 20);
    const offsetY = Phaser.Math.Between(-20, 20);

    const droppedItem = new DroppedItem(this, x + offsetX, y + offsetY, item);
    this.droppedItems.add(droppedItem);
  }

  /**
   * 아이템 습득 체크
   */
  checkItemPickup() {
    this.droppedItems.getChildren().forEach(droppedItem => {
      if (droppedItem.canPickup(this.player)) {
        const item = droppedItem.pickup(this.player);

        // 플레이어 인벤토리에 추가
        const success = this.player.inventory.addItem(item);

        if (success) {
          console.log(`${item.name} x${item.quantity} 획득!`);

          // 획득 텍스트 표시
          this.showObtainText(item.name, item.quantity, droppedItem.x, droppedItem.y);
        } else {
          console.log('인벤토리가 가득 찼습니다!');
          // TODO: 아이템을 다시 필드에 드롭
        }
      }
    });
  }

  /**
   * 아이템 획득 텍스트 표시
   */
  showObtainText(itemName, quantity, x, y) {
    const text = this.add.text(x, y - 30, `${itemName} x${quantity}`, {
      font: 'bold 14px Arial',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  /**
   * 대미지 텍스트 표시
   */
  showDamageText(x, y, damage, isCritical = false, isEvaded = false, customColor = null) {
    let text;

    if (isEvaded) {
      // 회피 시 MISS 표시
      text = this.add.text(x, y, 'MISS!', {
        font: 'bold 24px Arial',
        fill: '#00D4FF',
        stroke: '#000000',
        strokeThickness: 4
      });
    } else if (isCritical) {
      // 크리티컬 시 노란색 + 더 큰 폰트
      text = this.add.text(x, y, `${damage}!`, {
        font: 'bold 28px Arial',
        fill: '#FFD700',
        stroke: '#FF0000',
        strokeThickness: 4
      });
    } else if (customColor) {
      // 커스텀 색상 (지속 피해 등)
      text = this.add.text(x, y, damage.toString(), {
        font: '18px Arial',
        fill: customColor,
        stroke: '#000000',
        strokeThickness: 3
      });
    } else {
      // 일반 대미지
      text = this.add.text(x, y, damage.toString(), {
        font: 'bold 20px Arial',
        fill: '#FF0000',
        stroke: '#000000',
        strokeThickness: 3
      });
    }

    text.setOrigin(0.5);
    text.setDepth(1000);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  /**
   * 설정 메뉴 표시
   */
  showSettingsMenu() {
    // 기존 설정창이 있으면 제거
    if (this.settingsMenu) {
      this.settingsMenu.destroy();
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 반응형 메뉴 크기 계산
    const menuWidth = Math.min(400, width * 0.8);
    const menuHeight = Math.min(350, height * 0.8); // 높이 증가
    const buttonWidth = Math.min(250, menuWidth * 0.7);
    const buttonHeight = 35;

    // 설정창 컨테이너
    this.settingsMenu = this.add.container(centerX, centerY);
    this.settingsMenu.setDepth(2000);
    this.settingsMenu.setScrollFactor(0);

    // 반투명 오버레이
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideSettingsMenu());
    this.settingsMenu.add(overlay);

    // 설정창 배경
    const menuBg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x1a1a2e, 0.95);
    menuBg.setStrokeStyle(3, 0xFFD700);
    menuBg.setInteractive({ useHandCursor: true });
    this.settingsMenu.add(menuBg);

    // 제목
    const title = this.add.text(0, -menuHeight / 2 + 25, '게임 메뉴', {
      font: `bold ${Math.max(18, menuWidth / 20)}px Arial`,
      fill: '#FFD700'
    });
    title.setOrigin(0.5);
    this.settingsMenu.add(title);

    // 메뉴 버튼들
    const buttonYStart = -menuHeight / 2 + 70;
    const buttonSpacing = Math.max(35, menuHeight / 10) + 5; // 간격 5px 증가

    // 설정 버튼
    const [settingsBg, settingsText] = this.createSettingsButton(centerX - 960, centerY + buttonYStart - 430, '⚙️ 설정', buttonWidth, buttonHeight, () => {
      console.log('설정 버튼 클릭 (구현 예정)');
      this.showNotification('설정 기능은 준비 중입니다');
    });
    this.settingsMenu.add(settingsBg);
    this.settingsMenu.add(settingsText);

    // 저장 버튼
    const [saveBg, saveText] = this.createSettingsButton(centerX - 960, centerY + buttonYStart + buttonSpacing - 430, '💾 저장', buttonWidth, buttonHeight, () => {
      console.log('저장 버튼 클릭');
      this.saveGame();
    });
    this.settingsMenu.add(saveBg);
    this.settingsMenu.add(saveText);

    // 불러오기 버튼
    const [loadBg, loadText] = this.createSettingsButton(centerX - 960, centerY + buttonYStart + buttonSpacing * 2 - 430, '📁 불러오기', buttonWidth, buttonHeight, () => {
      console.log('불러오기 버튼 클릭 (구현 예정)');
      this.showNotification('불러오기 기능은 준비 중입니다');
    });
    this.settingsMenu.add(loadBg);
    this.settingsMenu.add(loadText);

    // 게임 종료 버튼
    const [quitBg, quitText] = this.createSettingsButton(centerX - 960, centerY + buttonYStart + buttonSpacing * 3 - 430, '🚪 게임 종료', buttonWidth, buttonHeight, () => {
      console.log('게임 종료 버튼 클릭');
      this.quitGame();
    });
    this.settingsMenu.add(quitBg);
    this.settingsMenu.add(quitText);

    // ESC로 닫기 안내 (메뉴 안에 배치)
    const escHint = this.add.text(centerX - 960, menuHeight / 2 - 30, 'ESC로 닫기', {
      font: `${Math.max(12, menuWidth / 30)}px Arial`,
      fill: '#AAAAAA'
    });
    escHint.setOrigin(0.5);
    this.settingsMenu.add(escHint);
  }

  /**   * 설정 메뉴 버튼 생성
   */
  createSettingsButton(x, y, text, width, height, callback) {
    const bg = this.add.rectangle(x, y, width, height, 0x444444);
    bg.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(x, y, text, {
      font: `${Math.max(14, height * 0.8)}px Arial`,
      fill: '#FFFFFF'
    });
    buttonText.setOrigin(0.5);

    // 호버 효과
    const setHover = (isHover) => {
      bg.setFillStyle(isHover ? 0x666666 : 0x444444);
    };

    bg.on('pointerover', () => setHover(true));
    bg.on('pointerout', () => setHover(false));

    bg.on('pointerdown', (pointer, localX, localY, event) => {
      // 이벤트 전파를 막아서 오버레이 클릭 이벤트가 발생하지 않도록 함
      event.stopPropagation();
      callback();
    });

    return [bg, buttonText];
  }

  /**
   * 설정 메뉴 숨기기
   */
  hideSettingsMenu() {
    if (this.settingsMenu) {
      this.settingsMenu.destroy();
      this.settingsMenu = null;
    }
  }

  /**
   * 게임 저장
   */
  saveGame() {
    try {
      // 간단한 저장 데이터 (실제로는 더 많은 데이터 저장 필요)
      const saveData = {
        player: {
          x: this.player.x,
          y: this.player.y,
          hp: this.player.hp,
          mp: this.player.mp,
          exp: this.player.exp
        },
        currentMap: this.currentMap,
        timestamp: Date.now()
      };

      localStorage.setItem('aetherChronicle_save', JSON.stringify(saveData));
      this.showNotification('게임이 저장되었습니다!', 0x4CAF50);
      console.log('[GameScene] 게임 저장 완료');
    } catch (error) {
      console.error('[GameScene] 저장 실패:', error);
      this.showNotification('저장 실패!', 0xF44336);
    }
  }

  /**
   * 게임 종료
   */
  quitGame() {
    this.hideSettingsMenu();
    // 게임 종료 확인
    if (confirm('정말 게임을 종료하시겠습니까?')) {
      // 브라우저의 경우 페이지를 새로고침하거나 메인 메뉴로 돌아감
      window.location.reload();
    }
  }

  /**
   * 몬스터 스폰
   */
  spawnMonsters() {
    // 마을에서는 몬스터 생성하지 않음
    if (this.currentMap === 'town') {
      console.log('[GameScene] 마을에서는 몬스터를 생성하지 않습니다');
      return;
    }
    const mapWidth = this.map ? this.map.widthInPixels : this.cameras.main.width * 2;
    const mapHeight = this.map ? this.map.heightInPixels : this.cameras.main.height * 2;
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;

    // 초보 구역 - 슬라임 5마리 (가까운 곳)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 200 + Math.random() * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const slime = new Slime(this, x, y, Phaser.Math.Between(1, 3));
      this.monsters.add(slime);
    }

    // 중급 구역 - 늑대 4마리
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.5;
      const distance = 400 + Math.random() * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const wolf = new Wolf(this, x, y, 5);
      this.monsters.add(wolf);
    }

    // 중급+ 구역 - 고블린 3마리
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + 1.0;
      const distance = 550 + Math.random() * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const goblin = new Goblin(this, x, y, 8);
      this.monsters.add(goblin);
    }

    // 고급 구역 - 고블린 전사 2마리
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2 + 1.5;
      const distance = 700 + Math.random() * 50;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const goblinWarrior = new GoblinWarrior(this, x, y, 10);
      this.monsters.add(goblinWarrior);
    }

    // 원거리 - 하피 2마리
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2;
      const distance = 800 + Math.random() * 100;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      const harpy = new Harpy(this, x, y, 13);
      this.monsters.add(harpy);
    }

    // 탱커 - 오거 1마리
    const ogre = new Ogre(this, centerX + 600, centerY + 600, 17);
    this.monsters.add(ogre);

    // 필드 보스 - 황금 그리폰 (멀리 배치)
    const boss = new GoldenGryphon(this, centerX + 1000, centerY - 1000, 20);
    this.monsters.add(boss);

    console.log(`[GameScene] 총 ${this.monsters.getLength()}마리 몬스터 스폰 완료`);
  }

  /**
   * 충돌 설정
   */
  setupCollisions() {
    // 몬스터 간 충돌
    this.physics.add.collider(this.monsters, this.monsters);

    // 투사체 충돌 체크는 update에서 수동으로 처리
  }

  /**
   * 투사체와 몬스터 충돌 체크 (수동)
   */
  checkProjectileCollisions() {
    // 씬의 모든 투사체 찾기
    const projectiles = this.children.list.filter(obj =>
      obj.body && obj.damage && obj.owner === this.player
    );

    projectiles.forEach(projectile => {
      this.monsters.getChildren().forEach(monster => {
        if (monster.isDead) return;

        // 충돌 체크
        const distance = Phaser.Math.Distance.Between(
          projectile.x, projectile.y,
          monster.x, monster.y
        );

        if (distance < 30) { // 충돌 범위
          // 콤보 배율 적용
          const comboMultiplier = this.player.getComboMultiplier();
          const finalDamage = Math.floor(projectile.damage * comboMultiplier);

          // 피해 적용
          const result = monster.takeDamage(finalDamage, this.player);

          // 대미지 텍스트 표시
          this.showDamageText(monster.x, monster.y - 30, result.damage, result.isCrit, result.isEvaded);

          // 콤보 증가 (회피하지 않은 경우)
          if (!result.isEvaded) {
            this.player.increaseCombo();

            // 넉백 적용
            // 스킬 투사체면 스킬의 넉백 파워, 일반 투사체면 기본값
            let knockbackPower = projectile.knockbackPower || (result.isCrit ? 250 : 150);
            if (result.isCrit && projectile.knockbackPower) {
              knockbackPower *= 1.2; // 크리티컬 시 20% 추가 넉백
            }
            monster.applyKnockback(knockbackPower, 300, projectile);

            // 기절 효과 적용 (스킬 투사체인 경우)
            if (projectile.stunDuration) {
              monster.applyStun(projectile.stunDuration);
            }
          }

          // 투사체 제거
          projectile.destroy();
        }
      });
    });
  }

  /**
   * 타일맵 로드
   */
  loadTilemap(mapKey) {
    console.log(`[GameScene] 타일맵 로드: ${mapKey}`);

    // 타일맵 생성
    this.map = this.make.tilemap({ key: mapKey });
    this.currentMap = mapKey; // currentMap을 맵 키로 설정 (문자열)
    this.currentMapName = mapKey; // 맵 이름 저장

    // 타일셋 추가
    const tileset = this.map.addTilesetImage('grassland_tileset', 'grassland_tileset');

    // 레이어 생성
    this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0);
    this.collisionLayer = this.map.createLayer('Collision', tileset, 0, 0);

    // 충돌 레이어 설정
    if (this.collisionLayer) {
      this.collisionLayer.setCollisionByProperty({ collides: true });

      // 디버그용: 충돌 영역 표시 (개발 중에만)
      // this.collisionLayer.renderDebug(this.add.graphics(), {
      //   tileColor: null,
      //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200),
      //   faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      // });
    }

    // 월드 경계 설정 (맵 크기에 맞춤)
    let mapWidth = this.map.widthInPixels;
    let mapHeight = this.map.heightInPixels;

    // 화면 크기에 맞게 맵 크기 확장 (2배)
    const scaleFactor = 2;
    mapWidth *= scaleFactor;
    mapHeight *= scaleFactor;

    // 실제 맵 크기 저장 (미니맵 등에서 사용)
    this.actualMapWidth = mapWidth;
    this.actualMapHeight = mapHeight;

    // 타일맵 레이어 스케일 조정
    this.groundLayer.setScale(scaleFactor);
    this.collisionLayer.setScale(scaleFactor);

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 카메라 경계 설정
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    console.log(`[GameScene] 타일맵 크기: ${mapWidth}x${mapHeight} (확장됨)`);

    // 포탈 설정
    this.setupPortals();
  }

  /**
   * 플레이어와 충돌 레이어 충돌 설정
   */
  setupPlayerCollision() {
    // 기존 collider 제거
    if (this.playerCollider) {
      this.playerCollider.destroy();
      this.playerCollider = null;
    }

    // 새 collider 생성
    if (this.collisionLayer && this.player) {
      this.playerCollider = this.physics.add.collider(this.player, this.collisionLayer);
    }
  }

  /**
   * 포탈 오브젝트 설정
   */
  setupPortals() {
    if (!this.map) return;

    const objectLayer = this.map.getObjectLayer('Objects');
    if (!objectLayer) return;

    objectLayer.objects.forEach(obj => {
      if (obj.type === 'portal') {
        // 맵 스케일링에 맞게 포탈 위치 조정
        const scaleFactor = 2;
        const portalX = obj.x * scaleFactor;
        const portalY = obj.y * scaleFactor;

        // 포탈 시각적 표시
        const portal = this.add.circle(portalX, portalY, 24, 0x00FFFF, 0.5);
        portal.setDepth(50);

        // 애니메이션 효과
        this.tweens.add({
          targets: portal,
          alpha: 0.2,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });

        // 포탈 데이터 저장
        portal.portalData = {
          targetMap: obj.properties?.find(p => p.name === 'targetMap')?.value,
          targetX: obj.properties?.find(p => p.name === 'targetX')?.value,
          targetY: obj.properties?.find(p => p.name === 'targetY')?.value
        };

        console.log('[GameScene] 포탈 생성:', obj.name, '위치:', portalX, portalY, portal.portalData);
      }
    });
  }

  /**
   * 포탈 충돌 체크
   */
  checkPortalCollision() {
    const portals = this.children.list.filter(child => child.portalData);

    portals.forEach(portal => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        portal.x, portal.y
      );

      if (distance < 40) {
        // 포탈 이동 안내
        if (!portal.hintText) {
          portal.hintText = this.add.text(portal.x, portal.y - 50, 'F키: 이동', {
            font: '16px Arial',
            fill: '#FFFFFF',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
          });
          portal.hintText.setOrigin(0.5);
          portal.hintText.setDepth(100);
        }

        // F키로 이동
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('F'))) {
          this.changeMap(portal.portalData.targetMap, portal.portalData.targetX, portal.portalData.targetY);
        }
      } else {
        // 범위 벗어나면 힌트 제거
        if (portal.hintText) {
          portal.hintText.destroy();
          portal.hintText = null;
        }
      }
    });
  }

  /**
   * 맵 변경
   */
  changeMap(targetMap, targetX, targetY) {
    console.log(`[GameScene] 맵 변경: ${this.currentMap} -> ${targetMap}`);

    // 기존 충돌 collider 제거
    if (this.playerCollider) {
      this.playerCollider.destroy();
      this.playerCollider = null;
    }

    // 기존 맵 정리
    if (this.groundLayer) this.groundLayer.destroy();
    if (this.collisionLayer) this.collisionLayer.destroy();
    if (this.map) this.map.destroy();

    // 기존 몬스터 제거
    this.monsters.clear(true, true);

    // 기존 아이템 제거
    this.droppedItems.clear(true, true);

    // 기존 포탈 힌트 제거
    this.children.list.forEach(child => {
      if (child.hintText) {
        child.hintText.destroy();
        child.hintText = null;
      }
      if (child.portalData) {
        child.destroy();
      }
    });

    // 새 맵 로드
    this.loadTilemap(targetMap);
    // loadTilemap에서 currentMap과 currentMapName이 설정됨

    // 플레이어 위치 이동 (맵 스케일링 고려)
    const scaleFactor = 2;
    this.player.setPosition(targetX * scaleFactor, targetY * scaleFactor);

    // 충돌 재설정
    this.setupPlayerCollision();

    // 포탈 재설정
    this.setupPortals();
    
    // 필드 맵이면 몬스터 스폰
    if (targetMap === 'field') {
      this.spawnMonsters();
    }
  }

  /**
   * 알림 메시지 표시
   */
  showNotification(message, color) {
      if (typeof color === 'undefined') {
        color = 0xFFFFFF;
      }
      // 기존 알림 제거
      if (this.notificationText) {
        this.notificationText.destroy();
      }

      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      this.notificationText = this.add.text(width / 2, height - 50, message, {
        font: 'bold 16px Arial',
        fill: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2
      });
      this.notificationText.setOrigin(0.5);
      this.notificationText.setDepth(3000);

      // 3초 후 자동 제거
      this.time.delayedCall(3000, () => {
        if (this.notificationText) {
          this.tweens.add({
            targets: this.notificationText,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.notificationText) {
                this.notificationText.destroy();
                this.notificationText = null;
              }
            }
          });
        }
      });
    }
  }