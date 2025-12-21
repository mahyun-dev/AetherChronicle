import Phaser from 'phaser';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame, config = {}) {
        // texture가 없으면 기본 texture 사용
        if (!texture) {
            texture = null;
        }
        
        super(scene, x, y, texture, frame);

        // 기본 설정
        this.name = config.name || 'NPC';
        this.dialogues = config.dialogues || [];
        this.shopItems = config.shopItems || [];
        this.quests = config.quests || [];
        this.interactionRange = config.interactionRange || 50;
        this.isShop = config.isShop || false;
        this.isQuestGiver = config.isQuestGiver || false;
        this.isStoryNPC = config.isStoryNPC || false;

        // 물리 설정
        scene.physics.add.existing(this);
        this.body.setImmovable(true);
        this.body.setCollideWorldBounds(true);

        // 시각적 표시 (texture가 없으면 사각형으로 표시)
        if (!texture) {
            this.setDisplaySize(32, 32);
            // NPC 타입에 따라 색상 설정
            let color = 0x00ff00; // 기본 녹색
            if (this.isShop) color = 0x0000ff; // 상점은 파란색
            if (this.isQuestGiver) color = 0xffff00; // 퀘스트는 노란색
            
            // 간단한 그래픽 생성
            const graphics = scene.add.graphics();
            graphics.fillStyle(color);
            graphics.fillRect(-16, -16, 32, 32);
            graphics.generateTexture('npc_' + this.name.replace(/\s+/g, '_'), 32, 32);
            graphics.destroy();
            
            this.setTexture('npc_' + this.name.replace(/\s+/g, '_'));
        }

        // 애니메이션 설정 (있으면)
        if (config.animations) {
            this.createAnimations(config.animations);
        }

        // 씬에 추가
        scene.add.existing(this);

        // 상호작용 키 설정
        this.interactionKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.interactionKey.on('down', this.checkInteraction, this);

        // 이벤트 리스너
        this.on('pointerdown', this.onClick, this);
        this.setInteractive();
    }

    update() {
        // 플레이어와의 거리 체크
        const player = this.scene.player;
        if (player) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                player.x, player.y
            );

            if (distance <= this.interactionRange) {
                this.showInteractionHint();
            } else {
                this.hideInteractionHint();
            }
        }
    }

    checkInteraction() {
        const player = this.scene.player;
        if (!player) return;

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            player.x, player.y
        );

        if (distance <= this.interactionRange) {
            this.interact();
        }
    }

    interact() {
        if (this.isShop) {
            this.openShop();
        } else if (this.isQuestGiver) {
            this.openQuestDialog();
        } else if (this.isStoryNPC) {
            this.startDialogue();
        } else {
            this.startDialogue();
        }
    }

    startDialogue(dialogueIndex = 0) {
        if (this.dialogues.length === 0) return;

        const dialogue = this.dialogues[dialogueIndex];
        if (!dialogue) return;

        // 퀘스트 진행도 업데이트 (대화 시작 시)
        if (this.scene.player && this.scene.player.questManager) {
            this.scene.player.questManager.updateProgress('talk', this.name.toLowerCase().replace(' ', '_'));
        }

        // 대화 UI 열기
        this.scene.events.emit('npc:dialogue', {
            npc: this,
            dialogue: dialogue,
            index: dialogueIndex
        });
    }

    openShop() {
        this.scene.events.emit('npc:shop', {
            npc: this,
            items: this.shopItems
        });
    }

    openQuestDialog() {
        this.scene.events.emit('npc:quests', {
            npc: this,
            quests: this.quests
        });
    }

    showInteractionHint() {
        // 상호작용 힌트 표시 (F키 아이콘 등)
        if (!this.hintText) {
            this.hintText = this.scene.add.text(
                this.x, this.y - 40,
                'F키로 상호작용',
                {
                    fontSize: '12px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
        }
        this.hintText.setVisible(true);
    }

    hideInteractionHint() {
        if (this.hintText) {
            this.hintText.setVisible(false);
        }
    }

    onClick() {
        this.interact();
    }

    createAnimations(animations) {
        // 애니메이션 생성 (필요시 구현)
        animations.forEach(anim => {
            if (!this.scene.anims.exists(anim.key)) {
                this.scene.anims.create(anim);
            }
        });
    }

    destroy() {
        if (this.hintText) {
            this.hintText.destroy();
        }
        super.destroy();
    }
}