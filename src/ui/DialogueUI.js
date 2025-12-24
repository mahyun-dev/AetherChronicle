import Phaser from 'phaser';
import Constants from '../config/Constants.js';

export default class DialogueUI extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        this.scene = scene;
        this.isOpen = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        this.currentIndex = 0;

        // UI 요소 생성
        this.createUI();

        // 씬에 추가
        scene.add.existing(this);
        this.setVisible(false);

        // 이벤트 리스너
        scene.events.on('npc:dialogue', this.showDialogue, this);
        scene.input.keyboard.on('keydown-SPACE', this.nextDialogue, this);
        scene.input.keyboard.on('keydown-ENTER', this.nextDialogue, this);
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;

        // 배경 패널
        this.background = this.scene.add.rectangle(
            width / 2, height - 120,
            width - 40, 200,
            0x000000, 0.8
        );
        this.background.setStrokeStyle(2, 0xffffff);
        this.add(this.background);

        // NPC 이름
        this.nameText = this.scene.add.text(
            30, height - 200,
            '',
            {
                fontSize: '18px',
                color: '#ffff00',
                fontStyle: 'bold'
            }
        );
        this.add(this.nameText);

        // 대화 텍스트
        this.dialogueText = this.scene.add.text(
            30, height - 170,
            '',
            {
                fontSize: '16px',
                color: '#ffffff',
                wordWrap: { width: width - 80 }
            }
        );
        this.add(this.dialogueText);

        // 계속하기 힌트
        this.continueText = this.scene.add.text(
            width - 30, height - 30,
            '스페이스바 또는 엔터로 계속',
            {
                fontSize: '12px',
                color: '#cccccc'
            }
        ).setOrigin(1, 1);
        this.add(this.continueText);
    }

    showDialogue(data) {
        this.currentNPC = data.npc;
        this.currentDialogue = data.dialogue;
        this.currentIndex = data.index;

        this.nameText.setText(this.currentNPC.name);
        this.dialogueText.setText(this.currentDialogue.text);

        this.setVisible(true);
        this.isOpen = true;

        // 게임 일시정지 효과
        this.scene.scene.pause('GameScene');
    }

    nextDialogue() {
        if (!this.isOpen) return;

        // 다음 대화가 있는지 확인
        if (this.currentDialogue.next) {
            const nextIndex = this.currentDialogue.next;
            const nextDialogue = this.currentNPC.dialogues[nextIndex];

            if (nextDialogue) {
                this.currentIndex = nextIndex;
                this.currentDialogue = nextDialogue;
                this.dialogueText.setText(nextDialogue.text);
                return;
            }
        }

        // 대화 종료
        this.closeDialogue();
    }

    showShop(npc, items) {
        // 임시로 대화로 표시 (나중에 상점 UI 구현)
        this.showDialogue({
            npc: npc,
            dialogue: { text: '상점 기능은 아직 구현되지 않았습니다.', next: null },
            index: 0
        });
    }

    showQuests(npc, quests) {
        // 퀘스트 UI 열기
        if (this.scene.questUI) {
            this.scene.questUI.setVisible(true);
            this.scene.questUI.updateQuestList();
            // 게임 일시 정지
            this.scene.scene.pause('GameScene');
        } else {
            // 임시로 대화로 표시
            this.showDialogue({
                npc: npc,
                dialogue: { text: '퀘스트 기능은 아직 구현되지 않았습니다.', next: null },
                index: 0
            });
        }
    }

    closeDialogue() {
        this.setVisible(false);
        this.isOpen = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        this.currentIndex = 0;

        // 게임 재개
        this.scene.scene.resume('GameScene');
    }

    destroy() {
        this.scene.events.off('npc:dialogue', this.showDialogue, this);
        this.scene.input.keyboard.off('keydown-SPACE', this.nextDialogue, this);
        this.scene.input.keyboard.off('keydown-ENTER', this.nextDialogue, this);
        super.destroy();
    }
}