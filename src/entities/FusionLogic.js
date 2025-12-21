// FusionLogic.js
// 두 스킬의 능력치와 속성을 융합하여 새로운 스킬을 생성하는 핵심 로직

import fusionistSkills from '../../assets/data/fusionist_skills.json';
import fusionRecipes from '../../assets/data/fusion_recipes.json';

export function fuseSkills(skillA, skillB) {
  // 레시피 우선 검색
  const recipe = fusionRecipes.recipes.find(r =>
    (r.ingredients.includes(skillA.name) && r.ingredients.includes(skillB.name))
  );
  if (recipe) {
    // 융합 스킬의 타입 결정
    const fusedType = determineFusionType(skillA, skillB);
    
    return {
      id: recipe.result,
      name: recipe.name,
      description: recipe.description,
      type: fusedType,
      // 아래는 예시, 실제 구현 시 각 스킬 데이터에서 가져와야 함
      damageMultiplier: ((skillA.damageMultiplier || 1) + (skillB.damageMultiplier || 1)) * 0.8,
      cooldown: ((skillA.cooldown || 0) + (skillB.cooldown || 0)) / 2,
      mpCost: Math.floor(((skillA.mpCost || 0) + (skillB.mpCost || 0)) / 2),
      range: Math.max(skillA.range || 0, skillB.range || 0),
      knockbackPower: Math.max(skillA.knockbackPower || 0, skillB.knockbackPower || 0),
      element: combineElements(skillA.element, skillB.element)
    };
  }
  // 레시피가 없으면 불완전 융합 처리
  return {
    id: 'fusion_incomplete',
    name: '불완전한 융합',
    description: '알 수 없는 힘이 충돌하여 불안정한 효과를 냅니다.',
    type: 'aoe',
    damageMultiplier: ((skillA.damageMultiplier || 1) + (skillB.damageMultiplier || 1)) * 0.6,
    cooldown: ((skillA.cooldown || 0) + (skillB.cooldown || 0)) / 2,
    mpCost: Math.floor(((skillA.mpCost || 0) + (skillB.mpCost || 0)) / 2),
    element: combineElements(skillA.element, skillB.element)
  };
}

function determineFusionType(skillA, skillB) {
  // 두 스킬의 타입을 기반으로 융합 타입 결정
  const typeA = skillA.type;
  const typeB = skillB.type;
  
  // 같은 타입이면 그대로 유지
  if (typeA === typeB) return typeA;
  
  // 특정 조합에 대한 규칙
  if ((typeA === 'dash' && typeB === 'aoe') || (typeA === 'aoe' && typeB === 'dash')) return 'dash';
  if ((typeA === 'ranged' && typeB === 'aoe') || (typeA === 'aoe' && typeB === 'ranged')) return 'ranged';
  if ((typeA === 'melee' && typeB === 'aoe') || (typeA === 'aoe' && typeB === 'melee')) return 'aoe';
  if ((typeA === 'buff' && typeB === 'aoe') || (typeA === 'aoe' && typeB === 'buff')) return 'buff';
  
  // 기본적으로 더 공격적인 타입 선택
  const typePriority = { 'ranged': 4, 'aoe': 3, 'dash': 2, 'melee': 1, 'buff': 0 };
  return typePriority[typeA] > typePriority[typeB] ? typeA : typeB;
}

function combineElements(elemA, elemB) {
  if (!elemA || !elemB) return elemA || elemB || 'none';
  if (elemA === elemB) return elemA;
  // 예시: 화염+독=발화 독 등
  if ((elemA === 'fire' && elemB === 'poison') || (elemA === 'poison' && elemB === 'fire')) return '발화 독';
  return elemA + ' + ' + elemB;
}
