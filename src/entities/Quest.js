/**
 * Quest - 퀘스트 클래스
 */
export class Quest {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type; // 'hunt', 'collect', 'talk', 'explore'
    this.level = data.level || 1; // 권장 레벨
    this.giver = data.giver || 'unknown'; // NPC ID
    
    // 목표
    this.objectives = data.objectives || []; // [{ type, target, current, required, description }]
    
    // 보상
    this.rewards = {
      exp: data.rewards?.exp || 0,
      gold: data.rewards?.gold || 0,
      items: data.rewards?.items || [] // [{ id, quantity }]
    };
    
    // 상태
    this.status = 'available'; // 'available', 'active', 'completed', 'failed'
    this.startTime = null;
    this.completeTime = null;
    
    // 선행 퀘스트 요구사항
    this.prerequisites = data.prerequisites || []; // 완료해야 할 퀘스트 ID 목록
  }
  
  /**
   * 퀘스트 시작
   */
  start() {
    if (this.status !== 'available') {
      console.warn(`[Quest] ${this.name}은(는) 이미 진행 중이거나 완료되었습니다.`);
      return false;
    }
    
    this.status = 'active';
    this.startTime = Date.now();
    
    // 목표 초기화
    this.objectives.forEach(obj => {
      obj.current = 0;
    });
    
    console.log(`[Quest] ${this.name} 시작!`);
    return true;
  }
  
  /**
   * 목표 진행도 업데이트
   * @param {string} type - 목표 타입 ('kill', 'collect', 'talk', 'explore')
   * @param {string} target - 대상 (몬스터 ID, 아이템 ID, NPC ID 등)
   * @param {number} amount - 증가량
   */
  updateProgress(type, target, amount = 1) {
    if (this.status !== 'active') return false;
    
    let updated = false;
    
    this.objectives.forEach(obj => {
      if (obj.type === type && obj.target === target) {
        obj.current = Math.min(obj.current + amount, obj.required);
        console.log(`[Quest] ${this.name} - ${obj.description}: ${obj.current}/${obj.required}`);
        updated = true;
      }
    });
    
    // 모든 목표 완료 확인
    if (this.isAllObjectivesComplete()) {
      this.status = 'completed';
      this.completeTime = Date.now();
      console.log(`[Quest] ${this.name} 완료!`);
    }
    
    return updated;
  }
  
  /**
   * 모든 목표 완료 여부
   */
  isAllObjectivesComplete() {
    return this.objectives.every(obj => obj.current >= obj.required);
  }
  
  /**
   * 퀘스트 진행률 (0~1)
   */
  getProgress() {
    if (this.objectives.length === 0) return 0;
    
    let totalProgress = 0;
    this.objectives.forEach(obj => {
      totalProgress += obj.current / obj.required;
    });
    
    return totalProgress / this.objectives.length;
  }
  
  /**
   * 퀘스트 정보 텍스트
   */
  getInfoText() {
    let text = `${this.name} [Lv ${this.level}]\n`;
    text += `${this.description}\n\n`;
    
    text += `[목표]\n`;
    this.objectives.forEach(obj => {
      const status = obj.current >= obj.required ? '✓' : ' ';
      text += `[${status}] ${obj.description} (${obj.current}/${obj.required})\n`;
    });
    
    text += `\n[보상]\n`;
    if (this.rewards.exp > 0) text += `경험치: ${this.rewards.exp}\n`;
    if (this.rewards.gold > 0) text += `골드: ${this.rewards.gold}\n`;
    if (this.rewards.items.length > 0) {
      text += `아이템:\n`;
      this.rewards.items.forEach(item => {
        text += `  - ${item.name || item.id} x${item.quantity}\n`;
      });
    }
    
    return text;
  }
  
  /**
   * 퀘스트 복제 (인스턴스 생성)
   */
  clone() {
    return new Quest({
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      level: this.level,
      giver: this.giver,
      objectives: this.objectives.map(obj => ({ ...obj })),
      rewards: {
        exp: this.rewards.exp,
        gold: this.rewards.gold,
        items: [...this.rewards.items]
      },
      prerequisites: [...this.prerequisites]
    });
  }
}
