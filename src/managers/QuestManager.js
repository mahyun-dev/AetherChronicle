import { Quest } from '../entities/Quest.js';
import { DataManager } from './DataManager.js';

/**
 * QuestManager - 퀘스트 관리 클래스
 */
export class QuestManager {
  constructor(player) {
    this.player = player;
    
    // 퀘스트 목록
    this.availableQuests = []; // 수락 가능한 퀘스트
    this.activeQuests = []; // 진행 중인 퀘스트
    this.completedQuests = []; // 완료한 퀘스트
    
    // 최대 동시 진행 퀘스트 수
    this.maxActiveQuests = 10;
    
    // 퀘스트 데이터 로드
    this.loadQuests();
  }
  
  /**
   * 퀘스트 데이터 로드
   */
  loadQuests() {
    const dataManager = DataManager.getInstance();
    const questsData = dataManager.getAllQuests();
    
    if (!questsData || questsData.length === 0) {
      console.warn('[QuestManager] 퀘스트 데이터를 찾을 수 없습니다.');
      return;
    }
    
    // 모든 퀘스트를 available로 추가 (초기 로드 시에만)
    questsData.forEach(questData => {
      const quest = new Quest(questData);
      // 중복 체크 강화
      if (!this.availableQuests.some(q => q.id === quest.id)) {
        this.availableQuests.push(quest);
      }
    });
    
    console.log(`[QuestManager] ${this.availableQuests.length}개의 퀘스트 로드 완료`);
  }
  
  /**
   * 선행 퀘스트 완료 여부 확인
   */
  arePrerequisitesMet(quest) {
    for (const prerequisiteId of quest.prerequisites) {
      if (!this.isQuestCompleted(prerequisiteId)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 퀘스트 수락 가능 여부
   */
  canAcceptQuest(quest) {
    // 이미 진행 중이거나 완료한 퀘스트인지 확인
    if (this.isQuestActive(quest.id) || this.isQuestCompleted(quest.id)) {
      return false;
    }
    
    // 레벨 요구사항 확인
    if (this.player.level < quest.level) {
      return false;
    }
    
    // 선행 퀘스트 완료 여부 확인
    if (!this.arePrerequisitesMet(quest)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 퀘스트 수락
   */
  acceptQuest(questId) {
    const quest = this.availableQuests.find(q => q.id === questId);
    
    if (!quest) {
      console.warn(`[QuestManager] 퀘스트를 찾을 수 없습니다: ${questId}`);
      return false;
    }
    
    if (this.activeQuests.length >= this.maxActiveQuests) {
      console.warn('[QuestManager] 더 이상 퀘스트를 수락할 수 없습니다.');
      return false;
    }
    
    if (!this.canAcceptQuest(quest)) {
      console.warn(`[QuestManager] 퀘스트 수락 조건이 맞지 않습니다: ${quest.name}`);
      return false;
    }
    
    // 퀘스트 시작
    quest.start();
    
    // available에서 제거하고 active에 추가
    this.availableQuests = this.availableQuests.filter(q => q.id !== questId);
    this.activeQuests.push(quest);
    
    // 이벤트 발생
    this.player.scene.events.emit('quest:accepted', quest);
    
    console.log(`[QuestManager] 퀘스트 수락: ${quest.name}`);
    return true;
  }
  
  /**
   * 퀘스트 진행도 업데이트
   */
  updateProgress(type, target, amount = 1) {
    let updated = false;
    
    this.activeQuests.forEach(quest => {
      if (quest.updateProgress(type, target, amount)) {
        updated = true;
        
        // 이벤트 발생
        this.player.scene.events.emit('quest:progress', quest);
        
        // 퀘스트 완료 확인
        if (quest.status === 'completed') {
          this.completeQuest(quest.id);
        }
      }
    });
    
    return updated;
  }
  
  /**
   * 퀘스트 완료
   */
  completeQuest(questId) {
    const quest = this.activeQuests.find(q => q.id === questId);
    
    if (!quest) {
      console.warn(`[QuestManager] 진행 중인 퀘스트를 찾을 수 없습니다: ${questId}`);
      return false;
    }
    
    if (!quest.isAllObjectivesComplete()) {
      console.warn(`[QuestManager] 퀘스트 목표가 완료되지 않았습니다: ${quest.name}`);
      return false;
    }
    
    // 보상 지급
    this.giveRewards(quest);
    
    // active에서 제거하고 completed에 추가
    this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
    this.completedQuests.push(quest);
    
    // 새로운 퀘스트 해금 확인
    this.checkUnlockedQuests();
    
    // 이벤트 발생
    this.player.scene.events.emit('quest:completed', quest);
    
    console.log(`[QuestManager] 퀘스트 완료: ${quest.name}`);
    return true;
  }
  
  /**
   * 보상 지급
   */
  giveRewards(quest) {
    // 경험치
    if (quest.rewards.exp > 0) {
      this.player.gainExp(quest.rewards.exp);
      console.log(`[QuestManager] 경험치 획득: ${quest.rewards.exp}`);
    }
    
    // 골드
    if (quest.rewards.gold > 0) {
      this.player.gold += quest.rewards.gold;
      this.player.scene.events.emit('player:gold_changed', this.player.gold);
      console.log(`[QuestManager] 골드 획득: ${quest.rewards.gold}`);
    }
    
    // 아이템
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      const dataManager = DataManager.getInstance();
      const { Item } = require('../entities/Item.js');
      
      quest.rewards.items.forEach(rewardItem => {
        const itemData = dataManager.getItem(rewardItem.id);
        if (itemData) {
          const item = new Item(itemData);
          item.quantity = rewardItem.quantity || 1;
          this.player.inventory.addItem(item);
          console.log(`[QuestManager] 아이템 획득: ${item.name} x${item.quantity}`);
        }
      });
    }
  }
  
  /**
   * 새로운 퀘스트 해금 확인
   */
  checkUnlockedQuests() {
    const dataManager = DataManager.getInstance();
    const questsData = dataManager.getAllQuests();
    
    if (!questsData) return;
    
    questsData.forEach(questData => {
      // 이미 수락 가능 목록에 있거나, 진행 중이거나, 완료한 퀘스트는 제외
      if (this.availableQuests.some(q => q.id === questData.id) ||
          this.activeQuests.some(q => q.id === questData.id) ||
          this.completedQuests.some(q => q.id === questData.id)) {
        return;
      }
      
      const quest = new Quest(questData);
      
      // 선행 퀘스트가 완료되었고, 수락 가능한 퀘스트인지 확인
      if (this.canAcceptQuest(quest) && this.arePrerequisitesMet(quest)) {
        this.availableQuests.push(quest);
        this.player.scene.events.emit('quest:unlocked', quest);
        console.log(`[QuestManager] 새 퀘스트 해금: ${quest.name}`);
      }
    });
  }
  
  /**
   * 퀘스트 진행 중 여부
   */
  isQuestActive(questId) {
    return this.activeQuests.some(q => q.id === questId);
  }
  
  /**
   * 퀘스트 완료 여부
   */
  isQuestCompleted(questId) {
    return this.completedQuests.some(q => q.id === questId);
  }
  
  /**
   * ID로 퀘스트 가져오기
   */
  getQuest(questId) {
    return this.availableQuests.find(q => q.id === questId) ||
           this.activeQuests.find(q => q.id === questId) ||
           this.completedQuests.find(q => q.id === questId);
  }
  
  /**
   * 모든 진행 중인 퀘스트 가져오기
   */
  getActiveQuests() {
    return [...this.activeQuests];
  }
  
  /**
   * 모든 수락 가능한 퀘스트 가져오기
   */
  getAvailableQuests() {
    return this.availableQuests.filter(q => this.canAcceptQuest(q));
  }
  
  /**
   * 완료한 퀘스트 개수
   */
  getCompletedQuestCount() {
    return this.completedQuests.length;
  }
}
