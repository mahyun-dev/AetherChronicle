  /**
   * 캐릭터 스프라이트 로드
   */
  loadCharacterSprites() {
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
    this.load.image('slime', 'assets/images/characters/slime.png');
    this.load.image('wolf', 'assets/images/characters/wolf.png');

    // 마법사 공격 효과
    this.load.image('mage_attack', 'assets/images/characters/MageAttack.png');

    console.log('[PreloadScene] 캐릭터 스프라이트 로드 완료');
  }
}