/**
 * DataManager - 게임 데이터 관리 싱글톤
 * JSON 파일로부터 게임 데이터를 로드하고 관리
 */
export class DataManager {
  static instance = null;

  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  constructor() {
    if (DataManager.instance) {
      throw new Error("Use DataManager.getInstance()");
    }

    // 데이터 저장소
    this.monsters = new Map();
    this.items = new Map();
    this.skills = new Map();
    this.equipments = new Map();
    this.quests = new Map();
    
    this.isLoaded = false;
  }

  /**
   * 모든 데이터 로드
   */
  async loadAllData() {
    console.log('[DataManager] 데이터 로딩 시작...');
    
    try {
      await Promise.all([
        this.loadMonsterData(),
        this.loadItemData(),
        this.loadSkillData(),
        this.loadEquipmentData(),
        this.loadQuestData()
      ]);
      
      this.isLoaded = true;
      console.log('[DataManager] 모든 데이터 로딩 완료');
    } catch (error) {
      console.error('[DataManager] 데이터 로딩 실패:', error);
    }
  }

  /**
   * 몬스터 데이터 로드
   */
  async loadMonsterData() {
    try {
      const response = await fetch('assets/data/monsters.json');
      const data = await response.json();
      
      Object.entries(data).forEach(([id, monsterData]) => {
        this.monsters.set(id, monsterData);
      });
      
      console.log(`[DataManager] 몬스터 데이터 로드: ${this.monsters.size}개`);
    } catch (error) {
      console.warn('[DataManager] 몬스터 데이터 로드 실패, 기본 데이터 사용');
      this.loadDefaultMonsterData();
    }
  }

  /**
   * 아이템 데이터 로드
   */
  async loadItemData() {
    try {
      const response = await fetch('assets/data/items.json');
      const data = await response.json();
      
      Object.entries(data).forEach(([id, itemData]) => {
        this.items.set(id, itemData);
      });
      
      console.log(`[DataManager] 아이템 데이터 로드: ${this.items.size}개`);
    } catch (error) {
      console.warn('[DataManager] 아이템 데이터 로드 실패, 기본 데이터 사용');
      this.loadDefaultItemData();
    }
  }

  /**
   * 스킬 데이터 로드
   */
  async loadSkillData() {
    try {
      const response = await fetch('assets/data/skills.json');
      if (!response.ok) {
        console.log('[DataManager] 스킬 데이터 없음 - Phase 1에서는 필요 없음');
        return;
      }
      const data = await response.json();
      
      Object.entries(data).forEach(([id, skillData]) => {
        this.skills.set(id, skillData);
      });
      
      console.log(`[DataManager] 스킬 데이터 로드: ${this.skills.size}개`);
    } catch (error) {
      console.log('[DataManager] 스킬 데이터 없음 - Phase 1에서는 필요 없음');
    }
  }

  /**
   * 장비 데이터 로드
   */
  async loadEquipmentData() {
    try {
      const response = await fetch('assets/data/equipments.json');
      const data = await response.json();
      
      Object.entries(data).forEach(([id, equipmentData]) => {
        this.equipments.set(id, equipmentData);
      });
      
      console.log(`[DataManager] 장비 데이터 로드: ${this.equipments.size}개`);
    } catch (error) {
      console.warn('[DataManager] 장비 데이터 로드 실패');
    }
  }

  /**
   * 퀘스트 데이터 로드
   */
  async loadQuestData() {
    try {
      const response = await fetch('assets/data/quests.json');
      const data = await response.json();
      
      Object.entries(data).forEach(([id, questData]) => {
        this.quests.set(id, questData);
      });
      
      console.log(`[DataManager] 퀘스트 데이터 로드: ${this.quests.size}개`);
    } catch (error) {
      console.warn('[DataManager] 퀘스트 데이터 로드 실패:', error);
    }
  }

  /**
   * 기본 몬스터 데이터 (폴백)
   */
  loadDefaultMonsterData() {
    const defaultMonsters = {
      slime_lv1: {
        id: 'slime_lv1',
        name: '슬라임',
        level: 1,
        maxHp: 30,
        speed: 60,
        attack: 5,
        defense: 1,
        expReward: 10,
        goldReward: [1, 3],
        aggroRange: 250,
        attackRange: 40,
        drops: [
          { itemId: 'slime_jelly', chance: 0.5, quantity: [1, 2] }
        ]
      },
      slime_lv3: {
        id: 'slime_lv3',
        name: '강화 슬라임',
        level: 3,
        maxHp: 60,
        speed: 70,
        attack: 8,
        defense: 2,
        expReward: 20,
        goldReward: [3, 6],
        aggroRange: 300,
        attackRange: 50,
        drops: [
          { itemId: 'slime_jelly', chance: 0.7, quantity: [2, 4] },
          { itemId: 'potion_hp_small', chance: 0.2, quantity: 1 }
        ]
      },
      wolf_lv5: {
        id: 'wolf_lv5',
        name: '숲늑대',
        level: 5,
        maxHp: 100,
        speed: 120,
        attack: 12,
        defense: 5,
        expReward: 35,
        goldReward: [5, 10],
        aggroRange: 400,
        attackRange: 60,
        drops: [
          { itemId: 'wolf_fang', chance: 0.6, quantity: 1 },
          { itemId: 'wolf_leather', chance: 0.4, quantity: [1, 2] }
        ]
      }
    };

    Object.entries(defaultMonsters).forEach(([id, data]) => {
      this.monsters.set(id, data);
    });
  }

  /**
   * 기본 아이템 데이터 (폴백)
   */
  loadDefaultItemData() {
    const defaultItems = {
      slime_jelly: {
        id: 'slime_jelly',
        name: '슬라임 젤리',
        type: 'material',
        description: '슬라임이 남긴 끈적한 젤리',
        stackable: true,
        maxStack: 99,
        sellPrice: 2
      },
      potion_hp_small: {
        id: 'potion_hp_small',
        name: '초급 체력 물약',
        type: 'consumable',
        description: 'HP 50 회복',
        effect: { type: 'heal_hp', value: 50 },
        stackable: true,
        maxStack: 99,
        sellPrice: 10
      },
      wolf_fang: {
        id: 'wolf_fang',
        name: '늑대 송곳니',
        type: 'material',
        description: '날카로운 늑대의 이빨',
        stackable: true,
        maxStack: 99,
        sellPrice: 8
      },
      wolf_leather: {
        id: 'wolf_leather',
        name: '늑대 가죽',
        type: 'material',
        description: '질긴 늑대 가죽',
        stackable: true,
        maxStack: 99,
        sellPrice: 12
      }
    };

    Object.entries(defaultItems).forEach(([id, data]) => {
      this.items.set(id, data);
    });
  }

  /**
   * 몬스터 데이터 가져오기
   */
  getMonster(monsterId) {
    return this.monsters.get(monsterId);
  }

  /**
   * 아이템 데이터 가져오기
   */
  getItem(itemId) {
    return this.items.get(itemId);
  }

  /**
   * 스킬 데이터 가져오기
   */
  getSkill(skillId) {
    return this.skills.get(skillId);
  }

  /**
   * 아이템 데이터 가져오기
   */
  getItem(itemId) {
    return this.items.get(itemId);
  }

  /**
   * 장비 데이터 가져오기
   */
  getEquipment(equipmentId) {
    return this.equipments.get(equipmentId);
  }

  /**
   * 퀘스트 데이터 가져오기
   */
  getQuest(questId) {
    return this.quests.get(questId);
  }

  /**
   * 모든 퀘스트 목록
   */
  getAllQuests() {
    return Array.from(this.quests.values());
  }

  /**
   * 모든 몬스터 목록
   */
  getAllMonsters() {
    return Array.from(this.monsters.values());
  }

  /**
   * 모든 아이템 목록
   */
  getAllItems() {
    return Array.from(this.items.values());
  }

  /**
   * 모든 장비 목록
   */
  getAllEquipments() {
    return Array.from(this.equipments.values());
  }
}
