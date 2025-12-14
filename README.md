# ⚔️ Aether Chronicle (에테르 크로니클)
## 2D 오픈월드 액션 RPG 웹게임 완전 기획서

> **플랫폼**: PC 웹 브라우저 (Chrome, Edge, Firefox)  
> **기술 스택**: Phaser 3 Framework  
> **장르**: 2D Top-down 액션 RPG  
> **개발 방향**: 싱글플레이 완성 우선 (멀티플레이는 추후 확장)

---

## 📑 목차
1. [조작 시스템](#1-조작-시스템)
2. [캐릭터 및 스킬 시스템](#2-캐릭터-및-스킬-시스템)
3. [스탯 및 성장 시스템](#3-스탯-및-성장-시스템)
4. [전투 시스템](#4-전투-시스템)
5. [오픈월드 맵 디자인](#5-오픈월드-맵-디자인)
6. [몬스터 시스템](#6-몬스터-시스템)
7. [아이템 및 장비 시스템](#7-아이템-및-장비-시스템)
8. [경제 및 상점 시스템](#8-경제-및-상점-시스템)
9. [강화 시스템](#9-강화-시스템)
10. [퀘스트 시스템](#10-퀘스트-시스템)
11. [UI/UX 설계](#11-uiux-설계)
12. [저장 시스템](#12-저장-시스템)
13. [개발 우선순위](#13-개발-우선순위)

---

## 1. 🕹️ 조작 시스템

### 1.1 기본 조작
| 분류 | 조작 키 | 상세 설명 |
|------|---------|-----------|
| **이동** | WASD 또는 방향키 | 8방향 자유 이동, 이동 속도는 민첩 스탯 영향 |
| **일반 공격** | 마우스 좌클릭 | 마우스 커서 방향으로 공격, 무기 종류에 따라 사거리 차이 |
| **스킬 1** | 1 키 | Lv 10 해금, 쿨타임 5~8초 |
| **스킬 2** | 2 키 | Lv 15 해금, 쿨타임 8~12초 |
| **스킬 3** | 3 키 | Lv 20 해금, 쿨타임 12~15초 |
| **궁극기** | R 키 | Lv 30 해금, 쿨타임 60~90초 |
| **상호작용** | E 키 | NPC 대화, 아이템 획득, 오브젝트 상호작용 |
| **인벤토리** | I 키 | 인벤토리 및 캐릭터 창 토글 |
| **퀵슬롯 1** | Q 키 | 체력 물약 (기본값) |
| **퀵슬롯 2** | F 키 | 마나 물약 (기본값) |
| **퀵슬롯 3** | Z 키 | 특수 소모품 (버프 물약, 귀환 주문서 등) |
| **퀘스트 로그** | L 키 | 진행 중인 퀘스트 목록 |
| **월드맵** | M 키 | 미니맵 확대 및 월드맵 표시 |
| **ESC 메뉴** | ESC 키 | 설정, 저장, 게임 종료 등 |

### 1.2 마우스 조작
- **좌클릭**: 일반 공격 / UI 버튼 클릭
- **우클릭**: 스킬 퀵캐스팅 (마우스 방향으로 즉시 발동)
- **마우스 휠**: 줌인/줌아웃 (카메라 거리 조절)
- **드래그**: 아이템 이동, 장비 착용/해제

---

## 2. 🛡️ 캐릭터 및 스킬 시스템

### 2.1 클래스 개요
모든 클래스는 **일반 스킬 3개 + 궁극기 1개 + 패시브 1개**를 보유합니다.

### 2.2 검사 (Warrior)
**컨셉**: 근접 전사, 높은 생존력과 돌진형 플레이

**일반 공격**: 검으로 전방을 베어 물리 피해를 줍니다. (사거리: 120px, 공격 속도: 1.2초)

| 스킬명 | 해금 레벨 | 쿨타임 | 마나 소모 | 효과 |
|--------|-----------|--------|-----------|------|
| **철벽 훈련** (패시브) | Lv 5 | - | - | 최대 HP +20%, 받는 피해 -5% |
| **돌진 베기** | Lv 10 | 6초 | 30 | 전방 300px 돌진하며 경로상 적에게 120% 공격력 피해 |
| **방어 자세** | Lv 15 | 10초 | 40 | 3초간 받는 피해 60% 감소, 이동 속도 50% 감소 |
| **회전 베기** | Lv 20 | 12초 | 50 | 주변 250px 범위에 150% 광역 피해 |
| **파멸의 일격** (궁극기) | Lv 30 | 75초 | 100 | 전방 직선으로 강력한 충격파 발사, 400% 피해 + 2초 기절 |

### 2.3 아처 (Archer)
**컨셉**: 원거리 딜러, 기동성과 포지셔닝 중시

**일반 공격**: 화살을 발사하여 원거리 물리 피해를 줍니다. (사거리: 500px, 공격 속도: 1.0초)

| 스킬명 | 해금 레벨 | 쿨타임 | 마나 소모 | 효과 |
|--------|-----------|--------|-----------|------|
| **집중력** (패시브) | Lv 5 | - | - | 치명타 확률 +15%, 치명타 피해 +30% |
| **관통 화살** | Lv 10 | 5초 | 25 | 직선으로 관통하는 화살 발사, 130% 피해 |
| **후퇴 사격** | Lv 15 | 8초 | 35 | 후방으로 도약하며 전방에 3발의 화살 발사 (각 80% 피해) |
| **독화살** | Lv 20 | 14초 | 45 | 독 화살 발사, 명중 시 100% 피해 + 5초간 초당 20 독 피해 |
| **폭풍우 화살** (궁극기) | Lv 30 | 60초 | 80 | 하늘에서 화살 폭풍 발생, 8초간 400px 범위 내 적에게 초당 100 피해 |

### 2.4 마법사 (Mage)
**컨셉**: 원거리 광역 딜러, 마나 관리 중요

**일반 공격**: 마력탄을 발사하여 마법 피해를 줍니다. (사거리: 450px, 공격 속도: 1.0초)

| 스킬명 | 해금 레벨 | 쿨타임 | 마나 소모 | 효과 |
|--------|-----------|--------|-----------|------|
| **마나 회복** (패시브) | Lv 5 | - | - | 마나 재생 속도 +50%, 최대 마나 +15% |
| **마력탄** | Lv 10 | 4초 | 30 | 단일 대상에게 140% 마법 피해 |
| **화염 폭발** | Lv 15 | 10초 | 50 | 지정 위치에 200px 범위 폭발, 160% 광역 피해 |
| **냉기 파동** | Lv 20 | 12초 | 60 | 전방 부채꼴 범위에 120% 피해 + 3초간 이동속도 40% 감소 |
| **시간 왜곡** (궁극기) | Lv 30 | 90초 | 120 | 300px 범위 내 적 5초간 시간 정지 + 해제 시 300% 피해 |

### 2.5 도적 (Rogue)
**컨셉**: 고속 암살자, 높은 순간 폭딜

**일반 공격**: 단검으로 빠르게 찔러 물리 피해를 줍니다. (사거리: 80px, 공격 속도: 0.8초)

| 스킬명 | 해금 레벨 | 쿨타임 | 마나 소모 | 효과 |
|--------|-----------|--------|-----------|------|
| **민첩성** (패시브) | Lv 5 | - | - | 이동 속도 +20%, 회피율 +10% |
| **그림자 밟기** | Lv 10 | 6초 | 30 | 대상의 뒤로 순간이동 + 150% 백어택 피해 |
| **연막탄** | Lv 15 | 12초 | 40 | 2초간 투명 상태, 이동 속도 +30% |
| **독 폭탄** | Lv 20 | 15초 | 50 | 지정 위치에 독 가스 생성, 5초간 초당 40 피해 |
| **암살자의 춤** (궁극기) | Lv 30 | 70초 | 90 | 10초간 공격 속도 +100%, 치명타 확률 +50% |

---

## 3. 📊 스탯 및 성장 시스템

### 3.1 기본 스탯
레벨업 시마다 **5 스탯 포인트** 획득 (자유 배분)

| 스탯 | 효과 | 클래스별 추천 |
|------|------|---------------|
| **힘 (STR)** | 물리 공격력 +2, 최대 HP +5 | 검사, 도적 |
| **민첩 (DEX)** | 공격 속도 +0.5%, 치명타 확률 +0.3%, 회피율 +0.2% | 아처, 도적 |
| **지능 (INT)** | 마법 공격력 +2.5, 최대 MP +8, 마법 저항 +0.5% | 마법사 |
| **체력 (VIT)** | 최대 HP +10, 방어력 +1, HP 재생 +0.5/초 | 검사 |

### 3.2 2차 스탯 (계산 스탯)
- **물리 공격력** = 기본 공격력 + (STR × 2) + 무기 공격력
- **마법 공격력** = 기본 공격력 + (INT × 2.5) + 무기 공격력
- **방어력** = 기본 방어력 + (VIT × 1) + 방어구 방어력
- **치명타 확률** = 5% + (DEX × 0.3%)
- **치명타 피해** = 150% (기본값, 장비/패시브로 증가 가능)
- **공격 속도** = 1.0 + (DEX × 0.005)
- **이동 속도** = 200 px/s (기본값)

### 3.3 레벨 및 경험치 시스템
- **최대 레벨**: 50
- **레벨별 필요 경험치**: $\text{RequiredExp}(L) = 100 + (L \times 50) + (L^2 \times 5)$
- **레벨 1→2**: 155 EXP
- **레벨 10→11**: 1150 EXP
- **레벨 49→50**: 14650 EXP

---

## 4. ⚔️ 전투 시스템

### 4.1 전투 메커니즘
- **실시간 액션**: 플레이어와 몬스터 모두 실시간으로 행동
- **히트박스 기반**: Phaser Physics를 활용한 정확한 충돌 판정
- **피해 계산식**:
  - 물리 피해: $\text{Damage} = \max(1, \text{AttackPower} - \text{Defense} \times 0.5) \times \text{SkillMultiplier}$
  - 마법 피해: $\text{Damage} = \text{MagicPower} \times \text{SkillMultiplier} \times (1 - \text{MagicResist})$
  - 치명타: 피해량 × 1.5 (기본값)

### 4.2 상태 이상
| 상태 | 효과 | 지속 시간 |
|------|------|-----------|
| **기절 (Stun)** | 이동 및 행동 불가 | 1~3초 |
| **둔화 (Slow)** | 이동 속도 감소 | 3~5초 |
| **중독 (Poison)** | 지속 피해 | 5~10초 |
| **출혈 (Bleed)** | 지속 피해 (강화) | 3~6초 |
| **침묵 (Silence)** | 스킬 사용 불가 | 2~4초 |

### 4.3 전투 피드백
- **피해 숫자 팝업**: 일반(흰색), 치명타(노란색), 회피(MISS)
- **히트 이펙트**: 타격 시 파티클 효과
- **사운드**: 타격음, 스킬 발동음, 사망 효과음
- **화면 쉐이크**: 강력한 공격 시 카메라 진동

---

## 5. 🗺️ 오픈월드 맵 디자인

### 5.1 청크 시스템
- **청크 크기**: 1024×1024 픽셀
- **동적 로딩**: 플레이어 중심 5×5 청크 (총 25개 청크) 로드
- **언로딩**: 플레이어가 멀어지면 메모리에서 해제
- **프리로딩**: 이동 방향 기반 다음 청크 미리 로드
- **총 월드 크기**: 약 50×50 청크 = 51,200×51,200 픽셀 (예상)

### 5.2 맵 데이터 구조
```json
{
  "chunkX_Y": {
    "position": [X, Y],
    "tilesetKey": "grassland",
    "layers": ["ground", "decoration", "collision"],
    "spawns": [
      {"type": "monster", "id": "slime", "x": 100, "y": 200}
    ],
    "npcs": [
      {"id": "merchant_01", "x": 512, "y": 512}
    ]
  }
}
```

### 5.3 주요 지역 설계

#### 5.3.1 초보자의 숲 (Beginner's Forest)
- **레벨 범위**: 1~10
- **크기**: 8×8 청크
- **몬스터**: 슬라임(Lv 1~3), 숲늑대(Lv 4~7), 고블린(Lv 8~10)
- **특징**: 튜토리얼 NPC, 기본 퀘스트 집중
- **던전**: 고블린 동굴 (Lv 10, 파티 미니던전)

#### 5.3.2 황금 평원 (Golden Plains)
- **레벨 범위**: 10~20
- **크기**: 12×12 청크
- **몬스터**: 들개(Lv 10~12), 하피(Lv 13~16), 오거(Lv 17~20)
- **특징**: 광활한 사냥터, 채집 자원 풍부
- **필드 보스**: 황금 그리폰 (Lv 20)

#### 5.3.3 대도시 아르카나 (Arcana City)
- **레벨 범위**: 안전 지대
- **크기**: 6×6 청크
- **특징**:
  - 중앙 광장: 퀘스트 게시판, 이벤트 NPC
  - 상점가: 무기상, 방어구상, 잡화상, 물약상
  - 대장간: 장비 강화 NPC
  - 길드 홀: 메인 스토리 진행
  - 창고: 아이템 보관 (100슬롯)
  - 여관: HP/MP 완전 회복 (무료)

#### 5.3.4 어둠의 숲 (Dark Forest)
- **레벨 범위**: 20~30
- **크기**: 10×10 청크
- **몬스터**: 다크 엘프(Lv 21~24), 트롤(Lv 25~28), 데몬(Lv 29~30)
- **특징**: 높은 난이도, 좋은 드롭율
- **던전**: 망각의 신전 (Lv 25)

#### 5.3.5 화산 지대 (Volcanic Wastes)
- **레벨 범위**: 30~40
- **크기**: 10×10 청크
- **몬스터**: 화염 정령(Lv 31~34), 용족 전사(Lv 35~38), 마그마 골렘(Lv 39~40)
- **특징**: 화염 저항 필수, 환경 피해 존재
- **필드 보스**: 고대 드래곤 (Lv 40)

#### 5.3.6 에테르 차원 (Aether Dimension)
- **레벨 범위**: 40~50
- **크기**: 15×15 청크
- **몬스터**: 차원 악마(Lv 41~45), 타락한 천사(Lv 46~49), 에테르 수호자(Lv 50)
- **특징**: 최종 지역, 최고 보상
- **레이드 보스**: 에테르 군주 (Lv 50, 파티 권장)

---

## 6. 👾 몬스터 시스템

### 6.1 몬스터 등급
| 등급 | 색상 | HP 배율 | 공격력 배율 | 경험치 배율 | 드롭 확률 |
|------|------|---------|-------------|-------------|-----------|
| **일반** | 흰색 | 1.0x | 1.0x | 1.0x | 기본 |
| **정예** | 파란색 | 2.0x | 1.3x | 2.5x | +30% |
| **보스** | 금색 | 5.0x | 1.8x | 10.0x | +80% |
| **필드 보스** | 빨간색 | 15.0x | 2.5x | 50.0x | 고급 보상 보장 |

### 6.2 AI 행동 패턴

#### 6.2.1 기본 AI (일반 몬스터)
1. **대기 상태**: 제자리에서 순찰 (±100px)
2. **인식**: 플레이어가 500px 이내 진입 시 추적
3. **추적**: A* 알고리즘으로 경로 탐색
4. **공격**: 사거리 내 도달 시 기본 공격
5. **복귀**: 플레이어가 1000px 이상 멀어지면 원위치, HP 회복

#### 6.2.2 정예 AI
- 기본 AI + 스킬 1개 사용 (쿨타임 10초)
- 패턴 회피 기능 (플레이어 스킬 감지 시 회피 시도)

#### 6.2.3 보스 AI
- 다단계 페이즈 시스템
  - **페이즈 1** (100~70% HP): 기본 공격 + 스킬 A
  - **페이즈 2** (70~40% HP): 공격 속도 증가 + 스킬 A, B
  - **페이즈 3** (40~0% HP): 광폭화 (공격력 +50%) + 모든 스킬
- 광역 패턴 스킬 (바닥 표시 후 발동)
- 부하 소환 능력

### 6.3 몬스터 예시

#### 슬라임 (Lv 1)
- **HP**: 80
- **공격력**: 5~8
- **방어력**: 2
- **이동 속도**: 80 px/s
- **공격 패턴**: 점프 공격 (사거리 150px)
- **드롭**: 슬라임 젤리 (50%), 초급 체력 물약 (10%), 1~5 골드

#### 숲늑대 (Lv 5)
- **HP**: 250
- **공격력**: 15~22
- **방어력**: 8
- **이동 속도**: 150 px/s
- **공격 패턴**: 물어뜯기, 도약 공격 (쿨 6초)
- **드롭**: 늑대 가죽 (60%), 날카로운 송곳니 (20%), 10~20 골드

#### 황금 그리폰 (Lv 20, 필드 보스)
- **HP**: 12,000
- **공격력**: 80~120
- **방어력**: 45
- **이동 속도**: 200 px/s (비행)
- **스킬**:
  - **급강하**: 전방 직선 돌진 (200% 피해)
  - **날개 폭풍**: 주변 400px 광역 피해 + 넉백
  - **황금 깃털**: 5개의 깃털 투사체 발사
- **리젠 시간**: 1시간
- **드롭**: 그리폰의 날개 (100%), 황금 장비 상자 (50%), 500 골드

---

## 7. 🎒 아이템 및 장비 시스템

### 7.1 아이템 등급
| 등급 | 색상 | 드롭률 | 스탯 배율 | 강화 최대치 |
|------|------|--------|-----------|-------------|
| **일반** | 회색 | 60% | 1.0x | +3 |
| **고급** | 초록색 | 25% | 1.3x | +6 |
| **희귀** | 파란색 | 10% | 1.7x | +9 |
| **영웅** | 보라색 | 4% | 2.2x | +12 |
| **전설** | 주황색 | 1% | 3.0x | +15 |

### 7.2 장비 슬롯
1. **무기**: 공격력 + 추가 옵션
2. **투구**: 방어력 + HP
3. **갑옷**: 방어력 + 스탯
4. **장갑**: 방어력 + 공격 속도
5. **신발**: 방어력 + 이동 속도
6. **목걸이**: 특수 옵션 (치명타, 스킬 피해 등)
7. **반지 1**: 특수 옵션
8. **반지 2**: 특수 옵션
9. **벨트**: HP/MP 증가

### 7.3 무기 종류
| 무기 타입 | 적합 클래스 | 공격 속도 | 사거리 | 특징 |
|-----------|-------------|-----------|--------|------|
| **한손검** | 검사 | 보통 | 120px | 균형잡힌 성능 |
| **양손검** | 검사 | 느림 | 150px | 높은 공격력 |
| **단검** | 도적 | 매우 빠름 | 80px | 치명타 보너스 |
| **활** | 아처 | 보통 | 500px | 원거리 물리 공격 |
| **석궁** | 아처 | 느림 | 600px | 관통력 높음 |
| **지팡이** | 마법사 | 보통 | 450px | 마법 공격력 |
| **마법서** | 마법사 | 빠름 | 400px | 마나 재생 보너스 |

### 7.4 소모품
| 아이템 | 효과 | 쿨타임 | 구매 가격 |
|--------|------|--------|-----------|
| **초급 체력 물약** | HP 100 회복 | 5초 | 10 골드 |
| **중급 체력 물약** | HP 300 회복 | 5초 | 50 골드 |
| **고급 체력 물약** | HP 600 회복 | 5초 | 150 골드 |
| **초급 마나 물약** | MP 80 회복 | 5초 | 15 골드 |
| **중급 마나 물약** | MP 200 회복 | 5초 | 60 골드 |
| **귀환 주문서** | 3초 시전 후 아르카나로 귀환 | - | 50 골드 |
| **힘의 비약** | 10분간 공격력 +20% | 60초 | 200 골드 |
| **신속의 비약** | 10분간 이동속도 +30% | 60초 | 200 골드 |

### 7.5 재료 아이템
- **슬라임 젤리**: 초급 물약 제작 재료
- **늑대 가죽**: 가죽 방어구 제작
- **마법 수정**: 지팡이 제작 및 강화
- **철광석**: 무기/방어구 제작
- **미스릴 광석**: 고급 장비 제작

---

## 8. 💰 경제 및 상점 시스템

### 8.1 화폐
- **골드 (Gold)**: 기본 화폐, 몬스터 처치 및 퀘스트 보상으로 획득

### 8.2 상점 종류

#### 8.2.1 무기상
- **판매 품목**: 레벨별 무기 (일반~고급 등급)
- **가격 범위**: 100~5,000 골드
- **재입고**: 실시간

#### 8.2.2 방어구상
- **판매 품목**: 투구, 갑옷, 장갑, 신발 (일반~고급 등급)
- **가격 범위**: 80~4,000 골드

#### 8.2.3 잡화상
- **판매 품목**: 물약, 귀환 주문서, 채집 도구
- **가격 범위**: 10~500 골드
- **구매**: 플레이어가 획득한 재료 아이템 구매 (상점 가격의 50%)

#### 8.2.4 물약상
- **판매 품목**: 모든 등급의 체력/마나 물약, 버프 물약
- **가격 범위**: 10~300 골드

### 8.3 거래 시스템
- **현재**: NPC 상점만 지원
- **향후 확장**: 플레이어 간 거래 (멀티플레이 도입 시)

---

## 9. 🔨 강화 시스템

### 9.1 강화 메커니즘
- **위치**: 아르카나 대장간
- **비용**: $\text{Cost} = \text{BasePrice} \times (1 + \text{EnhanceLevel})^2 \times 10$
- **재료**: 강화석 (등급별 상이)

### 9.2 강화 확률
| 강화 단계 | 성공 확률 | 실패 시 | 파괴 확률 |
|-----------|-----------|---------|-----------|
| +0 → +1 | 95% | 유지 | 0% |
| +1 → +2 | 90% | 유지 | 0% |
| +2 → +3 | 85% | 유지 | 0% |
| +3 → +4 | 75% | 유지 | 0% |
| +4 → +5 | 65% | 유지 | 0% |
| +5 → +6 | 55% | 유지 | 0% |
| +6 → +7 | 45% | -1 단계 | 5% |
| +7 → +8 | 35% | -1 단계 | 10% |
| +8 → +9 | 25% | -2 단계 | 15% |
| +9 → +10 | 15% | -2 단계 | 20% |
| +10 이상 | 10% | -3 단계 | 30% |

### 9.3 강화 효과
- **무기**: 강화 단계당 공격력 +5%
- **방어구**: 강화 단계당 방어력 +5%
- **액세서리**: 강화 단계당 옵션 효과 +3%

### 9.4 강화석 종류
- **초급 강화석**: +0~+3, 드롭 보통
- **중급 강화석**: +4~+6, 드롭 낮음
- **고급 강화석**: +7~+9, 드롭 매우 낮음
- **전설 강화석**: +10 이상, 보스 전용 드롭

---

## 10. 📜 퀘스트 시스템

### 10.1 퀘스트 종류

#### 10.1.1 메인 퀘스트
- **특징**: 스토리 진행, 경험치 및 골드 보상 높음
- **예시**:
  - **Lv 1**: "숲의 위협" - 슬라임 10마리 처치
  - **Lv 10**: "고블린의 습격" - 고블린 동굴 탐험
  - **Lv 20**: "그리폰의 공포" - 황금 그리폰 처치
  - **Lv 30**: "어둠의 봉인" - 망각의 신전 클리어
  - **Lv 50**: "에테르의 진실" - 에테르 군주 격파

#### 10.1.2 서브 퀘스트
- **특징**: 선택 사항, 추가 보상 및 명성 획득
- **예시**:
  - "잃어버린 물건 찾기" - 아이템 수집 퀘스트
  - "늑대 가죽 수집" - 재료 수집 퀘스트
  - "몬스터 토벌" - 특정 몬스터 처치

#### 10.1.3 반복 퀘스트
- **특징**: 매일 초기화, 안정적인 수입원
- **예시**:
  - "일일 사냥" - 몬스터 30마리 처치 → 500 골드 + 경험치
  - "재료 수집" - 특정 재료 10개 → 물약 5개
  - "보스 토벌" - 필드 보스 1회 처치 → 강화석 보상

### 10.2 퀘스트 진행 상태
- **미수락**: 느낌표(!) 표시
- **진행 중**: 물음표(?) 표시, 진행도 표시
- **완료 가능**: 물음표(노란색) 표시
- **완료**: 퀘스트 로그에서 제거

### 10.3 보상 체계
| 퀘스트 타입 | 경험치 배율 | 골드 배율 | 추가 보상 |
|-------------|-------------|-----------|-----------|
| **메인** | 5.0x | 3.0x | 장비, 스킬 포인트 |
| **서브** | 2.0x | 1.5x | 재료, 강화석 |
| **반복** | 1.0x | 1.0x | 소모품 |

---

## 11. 🖥️ UI/UX 설계

### 11.1 HUD (Head-Up Display)
- **좌측 상단**: 레벨/이름과 HP·MP 바를 일렬 배치해 생존 정보를 한눈에 확인.
- **우측 상단**: 반투명 원형 미니맵 + 바로 아래 퀘스트 추적(최대 3개).
- **하단 중앙**: 스킬바와 퀵슬롯을 하나로 붙인 연속 바로 배치해 시선·손가락 이동 최소화.
- **좌측 하단**: 골드와 짧은 시스템 알림을 소형 텍스트로 표시.
- **우측 하단**: 인벤토리/스킬/월드맵/설정 등 메뉴 아이콘 바로가기.

시안 개념도 (중앙 하단 비움으로 전투 시야 확보):
```
┌─────────────────────────────────────────────────────────────┐
│ [Lv25] 이름   HP ████████░░  MP ██████░░░░                  │ ← 좌측 상단: 캐릭터 정보
│                                             ⭕ 미니맵       │
│                                             ─ 퀘스트1       │
│                                             ─ 퀘스트2       │
│                                                             │
│                      (전투/시야 영역)                       │
│                                                             │
│                                                             │
│  골드·알림                              메뉴 아이콘 모음    │
│                                                             │
│          [Q][F][Z]  |  [1][2][3][R]  |  [소모품][특수]      │ ← 하단 중앙: 퀵슬롯+스킬바 연속 배치
└─────────────────────────────────────────────────────────────┘
```

### 11.2 메뉴 UI (팝업창) 설계

모든 메뉴 팝업창은 게임 화면 위에 오버레이되며, 몰입감을 유지하기 위해 다음 원칙을 따릅니다:

#### 11.2.1 공통 디자인 원칙
- **배경 오버레이**: 게임 화면 위에 반투명 어두운 배경 (rgba(0, 0, 0, 0.5)) 적용
- **팝업 위치**: 화면 중앙에 배치하여 시선 집중
- **닫기 방법**: ESC 키 또는 창 우측 상단 [X] 버튼, 또는 팝업 외부 클릭
- **애니메이션**: 부드러운 페이드인/아웃 효과 (0.2초)
- **배경 흐림**: 게임 화면에 블러 효과(blur 5px) 적용하여 팝업에 집중

#### 11.2.2 팝업창 스타일
- **테두리**: 판타지풍 장식 프레임 (갈색 나무 또는 돌 질감)
- **배경색**: 반투명 어두운 패널 (rgba(20, 20, 30, 0.95))
- **제목 바**: 상단에 아이콘 + 메뉴명 표시 (예: 📦 인벤토리)
- **폰트**: 가독성 높은 산세리프 계열, 중요 정보는 굵게
- **색상 코드**:
  - 일반 텍스트: #E0E0E0 (밝은 회색)
  - 강조 텍스트: #FFD700 (골드)
  - 경고/위험: #FF4444 (빨강)
  - 성공/확인: #44FF44 (초록)

#### 11.2.3 반응형 크기
- **소형 팝업** (알림, 확인창): 400×200px
- **중형 팝업** (스킬창, 퀘스트 로그): 600×500px
- **대형 팝업** (인벤토리, 설정): 800×600px
- **전체 화면** (월드맵): 화면의 90% 크기

### 11.3 인벤토리 및 캐릭터 창 (I 키) - 통합형

하나의 창에서 장비 관리, 아이템 정리, 스탯 확인을 모두 처리할 수 있는 통합형 인터페이스입니다.

#### 11.3.1 레이아웃 구성

| 영역 | 내용 | 기능 |
|------|------|------|
| **좌측 패널** | 캐릭터 모델 및 장비 슬롯 (9개) | 장비 착용 상태를 시각적으로 보여주며, 드래그 & 드롭으로 장비 착용/해제 |
| **우측 중앙** | 인벤토리 그리드 (8×6 = 48 슬롯) | 아이템 관리, 슬롯 간 이동, 퀵슬롯으로 드래그 가능 |
| **우측 하단** | 플레이어 스탯 상세 정보 | 현재 스탯(힘, 민첩 등), 2차 스탯(공격력, 방어력 등) 상세 표시 |

#### 11.3.2 장비 슬롯 (좌측 패널)
1. **무기**: 공격력 + 추가 옵션
2. **투구**: 방어력 + HP
3. **갑옷**: 방어력 + 스탯
4. **장갑**: 방어력 + 공격 속도
5. **신발**: 방어력 + 이동 속도
6. **목걸이**: 특수 옵션 (치명타, 스킬 피해 등)
7. **반지 1**: 특수 옵션
8. **반지 2**: 특수 옵션
9. **벨트**: HP/MP 증가

**시각 표현**: 캐릭터 모델 주변에 장비 슬롯이 배치되며, 착용 시 캐릭터 외형이 변경됩니다.

#### 11.3.3 인벤토리 그리드 (우측 중앙)
- **크기**: 8×6 = 48 슬롯 (확장 불가)
- **아이템 표시**: 아이콘 + 수량 표시 (소모품의 경우)
- **등급별 색상**: 테두리 색상으로 아이템 등급 구분
- **정렬 기능**: 등급별, 종류별, 이름순 자동 정렬 버튼

#### 11.3.4 조작 방법
- **드래그 & 드롭**: 아이템을 드래그하여 장비 슬롯, 퀵슬롯, 다른 인벤토리 슬롯으로 이동
- **우클릭**: 아이템 사용 (소모품) 또는 장착 (장비)
- **Shift + 클릭**: 아이템 버리기 (확인 팝업 표시)
- **Ctrl + 클릭**: 아이템 분할 (수량이 있는 아이템)
- **마우스 오버**: 아이템 툴팁 표시 (스탯, 효과, 가격 등)

#### 11.3.5 스탯 정보 (우측 하단)
**기본 스탯**
- 힘 (STR): 45 | 민첩 (DEX): 30 | 지능 (INT): 20 | 체력 (VIT): 40
- 남은 스탯 포인트: 5 (각 스탯 옆 [+] 버튼으로 배분)

**2차 스탯 (계산 값)**
- 물리 공격력: 150 (+90 장비) = 240
- 마법 공격력: 80 (+20 장비) = 100
- 방어력: 85 (+120 장비) = 205
- 치명타 확률: 14%
- 공격 속도: 1.15
- 이동 속도: 220 px/s

**색상 코드**: 장비로 인한 추가 스탯은 초록색(#44FF44)으로 표시

### 11.4 스킬창 (K 키) - 상세화

스킬 관리와 레벨업을 효율적으로 수행할 수 있는 3단 구조 인터페이스입니다.

#### 11.4.1 레이아웃 구성

| 영역 | 내용 | 기능 |
|------|------|------|
| **좌측 패널** | 스킬 목록 (탭 방식) | 패시브, 일반 스킬, 궁극기 탭으로 구분하여 목록 표시 |
| **중앙** | 스킬 정보 | 선택된 스킬의 상세 효과, 피해량, 쿨타임, 마나 소모 표시 |
| **우측** | 스킬 레벨업 및 포인트 | 현재 보유 스킬 포인트 표시. 포인트를 소모하여 스킬 레벨을 올리는 버튼 제공 |

#### 11.4.2 좌측 패널 - 스킬 목록 (탭)

**탭 구조**
1. **패시브 스킬** (Lv 5 해금)
   - 아이콘: 방패 모양
   - 항상 활성화된 영구 효과
   - 예: 철벽 훈련, 집중력, 마나 회복, 민첩성

2. **일반 스킬** (Lv 10, 15, 20 해금)
   - 아이콘: 검 모양
   - 쿨타임이 있는 액티브 스킬
   - 각 클래스당 3개 스킬

3. **궁극기** (Lv 30 해금)
   - 아이콘: 왕관 모양
   - 긴 쿨타임의 강력한 스킬
   - 각 클래스당 1개

**스킬 목록 표시**
- 스킬 아이콘 + 스킬명
- 현재 레벨 표시 (예: Lv 3/5)
- 잠긴 스킬은 회색 표시 + 자물쇠 아이콘
- 레벨업 가능한 스킬은 노란색 테두리 표시

#### 11.4.3 중앙 - 스킬 정보

**상단: 스킬 기본 정보**
- **스킬 아이콘** (큼): 시각적 강조
- **스킬명**: 굵은 폰트, 골드 색상
- **해금 레벨**: "Lv 10 해금" 표시
- **스킬 설명**: 간단한 컨셉 설명

**중단: 스킬 효과 상세**
```
┌─────────────────────────────────────────┐
│ 🗡️ 돌진 베기 (Lv 3/5)                  │
│                                          │
│ 피해량: 120% → 130% (다음 레벨)          │
│ 쿨타임: 6초 → 5.7초 (다음 레벨)         │
│ 마나 소모: 30                            │
│ 사거리: 300px                            │
│                                          │
│ 효과: 전방 300px 돌진하며 경로상        │
│       적에게 130% 공격력 피해           │
│                                          │
│ 추가 효과:                               │
│ • 돌진 중 무적 상태                     │
│ • 충돌한 적 0.5초 기절                  │
└─────────────────────────────────────────┘
```

**하단: 레벨별 성장 정보**
- **Lv 1**: 피해 100%, 쿨타임 7초
- **Lv 2**: 피해 110%, 쿨타임 6.7초
- **Lv 3**: 피해 120%, 쿨타임 6초 (현재)
- **Lv 4**: 피해 130%, 쿨타임 5.7초 (다음)
- **Lv 5**: 피해 140%, 쿨타임 5초 (최대)

#### 11.4.4 우측 - 스킬 레벨업 시스템

**스킬 포인트 정보**
```
┌─────────────────────┐
│  💎 스킬 포인트     │
│                      │
│   보유: 3           │
│   사용: 12          │
│   총 획득: 15       │
│                      │
│ 다음 획득: Lv 26    │
└─────────────────────┘
```

**레벨업 버튼**
- **[스킬 레벨업]** 버튼 (중앙 배치)
  - 포인트 부족 시: 회색 비활성화
  - 최대 레벨 시: "MAX" 표시
  - 레벨업 가능 시: 노란색 강조 + 애니메이션
- 필요 포인트: 1포인트 (모든 스킬 동일)
- 클릭 시: 확인 팝업 표시 ("돌진 베기를 레벨업하시겠습니까?")

**스킬 포인트 획득 방법**
- ✅ 레벨업 (레벨당 1포인트)
- ❌ 퀘스트 보상 (불가)
- ❌ 아이템 사용 (불가)
- ❌ 기타 방법 (불가)

**주의 사항**: 스킬 포인트는 레벨업으로만 얻을 수 있으며, 초기화 기능은 없습니다. 신중하게 배분하세요!

#### 11.4.5 스킬 레벨 시스템
- **최대 레벨**: 5레벨
- **성장 효과**: 레벨당 피해 +10%, 쿨타임 -5%
- **마나 소모**: 레벨 상관없이 동일
- **총 필요 포인트**: 스킬당 4포인트 (Lv 1→5)

#### 11.4.6 단축키
- **Tab**: 탭 전환 (패시브 → 일반 → 궁극기)
- **↑/↓**: 스킬 목록 탐색
- **Enter**: 선택한 스킬 레벨업
- **ESC**: 스킬창 닫기

### 11.5 퀘스트 로그 (L 키)
- **진행 중 탭**: 현재 진행 중인 퀘스트 목록
- **완료 가능 탭**: 보상 수령 가능한 퀘스트
- **일일 퀘스트 탭**: 반복 퀘스트 목록
- **클릭 시**: 해당 NPC 위치 미니맵 표시

### 11.6 월드맵 (M 키)
- **전체 월드**: 모든 지역 표시
- **안개 시스템**: 미방문 지역은 어둡게 표시
- **아이콘**: NPC 위치, 몬스터 분포, 던전 입구, 필드 보스 위치
- **플레이어 위치**: 실시간 표시

### 11.7 설정 메뉴 (ESC)
- **게임 설정**: 사운드, 화면 효과, 키 설정
- **저장/불러오기**: 수동 저장 버튼
- **게임 종료**: 자동 저장 후 종료

---

## 12. 💾 저장 시스템

### 12.1 저장 방식
- **LocalStorage**: 브라우저 로컬 저장소 사용
- **자동 저장**: 5분마다 자동 저장
- **수동 저장**: ESC 메뉴에서 언제든지 가능

### 12.2 저장 데이터
```json
{
  "version": "1.0.0",
  "character": {
    "name": "플레이어명",
    "class": "warrior",
    "level": 25,
    "exp": 5420,
    "stats": {
      "str": 45,
      "dex": 20,
      "int": 10,
      "vit": 35
    },
    "position": {
      "map": "golden_plains",
      "x": 5120,
      "y": 3200
    },
    "hp": 800,
    "mp": 300
  },
  "inventory": {
    "gold": 1250,
    "items": [
      {"id": "sword_iron", "slot": 0, "quantity": 1, "enhance": 3},
      {"id": "potion_hp_medium", "slot": 5, "quantity": 20}
    ],
    "equipment": {
      "weapon": {"id": "sword_iron", "enhance": 3},
      "helmet": {"id": "helmet_steel", "enhance": 1}
    }
  },
  "quests": {
    "completed": ["quest_001", "quest_002"],
    "active": ["quest_010"],
    "daily_reset": "2025-12-14"
  },
  "unlocked": {
    "maps": ["beginners_forest", "golden_plains", "arcana_city"],
    "skills": [1, 2, 3, "ultimate", "passive"]
  },
  "playtime": 7200
}
```

### 12.3 데이터 복구
- **검증**: 로드 시 데이터 무결성 검사
- **백업**: 이전 저장 1개 백업 유지
- **손상 처리**: 데이터 손상 시 백업 불러오기 시도

---

## 13. 📁 데이터 기반 콘텐츠 관리 시스템

### 13.1 설계 철학
모든 게임 콘텐츠(아이템, 장비, 퀘스트, 몬스터, NPC 등)는 **JSON 데이터 파일**로 관리되어, 프로그래밍 지식 없이도 **관리자가 쉽게 추가/수정/삭제**할 수 있습니다.

### 13.2 데이터 파일 구조

```
/assets/data/
├── items/
│   ├── weapons.json          # 무기 데이터
│   ├── armors.json            # 방어구 데이터
│   ├── consumables.json       # 소모품 데이터
│   └── materials.json         # 재료 아이템 데이터
├── monsters/
│   ├── common.json            # 일반 몬스터
│   ├── elite.json             # 정예 몬스터
│   └── bosses.json            # 보스 몬스터
├── quests/
│   ├── main_quests.json       # 메인 퀘스트
│   ├── side_quests.json       # 서브 퀘스트
│   └── daily_quests.json      # 일일 퀘스트
├── npcs/
│   ├── merchants.json         # 상인 NPC
│   └── quest_givers.json      # 퀘스트 NPC
├── skills/
│   ├── warrior_skills.json    # 검사 스킬
│   ├── archer_skills.json     # 아처 스킬
│   ├── mage_skills.json       # 마법사 스킬
│   └── rogue_skills.json      # 도적 스킬
└── maps/
    ├── beginners_forest.json  # 초보자의 숲 맵 데이터
    ├── golden_plains.json     # 황금 평원 맵 데이터
    └── arcana_city.json       # 아르카나 도시 맵 데이터
```

### 13.3 아이템 데이터 예시

#### weapons.json
```json
{
  "sword_iron": {
    "id": "sword_iron",
    "name": "철검",
    "type": "weapon",
    "subType": "one_hand_sword",
    "tier": "common",
    "level": 5,
    "stats": {
      "attack": 20,
      "critChance": 0
    },
    "price": {
      "buy": 100,
      "sell": 50
    },
    "description": "기본적인 철로 만든 검",
    "icon": "sword_iron.png",
    "maxEnhance": 3
  },
  "sword_steel": {
    "id": "sword_steel",
    "name": "강철검",
    "type": "weapon",
    "subType": "one_hand_sword",
    "tier": "advanced",
    "level": 15,
    "stats": {
      "attack": 45,
      "critChance": 5
    },
    "price": {
      "buy": 500,
      "sell": 250
    },
    "description": "단단한 강철로 제작된 검",
    "icon": "sword_steel.png",
    "maxEnhance": 6
  }
}
```

#### consumables.json
```json
{
  "potion_hp_small": {
    "id": "potion_hp_small",
    "name": "초급 체력 물약",
    "type": "consumable",
    "subType": "hp_potion",
    "tier": "common",
    "effect": {
      "type": "heal_hp",
      "value": 100
    },
    "cooldown": 5,
    "price": {
      "buy": 10,
      "sell": 5
    },
    "stackable": true,
    "maxStack": 99,
    "description": "HP를 100 회복합니다.",
    "icon": "potion_hp_small.png"
  }
}
```

### 13.4 몬스터 데이터 예시

#### common.json
```json
{
  "slime_lv1": {
    "id": "slime_lv1",
    "name": "슬라임",
    "level": 1,
    "rank": "common",
    "stats": {
      "hp": 80,
      "attack": [5, 8],
      "defense": 2,
      "moveSpeed": 80
    },
    "ai": {
      "type": "basic",
      "aggroRange": 500,
      "attackRange": 150,
      "returnRange": 1000
    },
    "attacks": [
      {
        "id": "jump_attack",
        "cooldown": 3,
        "damage": 1.0,
        "range": 150
      }
    ],
    "exp": 10,
    "drops": [
      {"item": "slime_jelly", "chance": 0.5, "quantity": [1, 3]},
      {"item": "potion_hp_small", "chance": 0.1, "quantity": 1},
      {"item": "gold", "chance": 1.0, "quantity": [1, 5]}
    ],
    "sprite": "slime.png",
    "hitbox": {
      "width": 32,
      "height": 32
    }
  }
}
```

### 13.5 퀘스트 데이터 예시

#### main_quests.json
```json
{
  "quest_001": {
    "id": "quest_001",
    "title": "숲의 위협",
    "type": "main",
    "level": 1,
    "npc": "village_elder",
    "description": "마을 주변에 슬라임이 너무 많아졌습니다. 슬라임 10마리를 처치해주세요.",
    "objectives": [
      {
        "type": "kill",
        "target": "slime_lv1",
        "count": 10
      }
    ],
    "rewards": {
      "exp": 500,
      "gold": 100,
      "items": [
        {"id": "sword_iron", "quantity": 1}
      ]
    },
    "prerequisite": null,
    "nextQuest": "quest_002"
  }
}
```

### 13.6 스킬 데이터 예시

#### warrior_skills.json
```json
{
  "warrior_passive": {
    "id": "warrior_passive",
    "name": "철벽 훈련",
    "type": "passive",
    "unlockLevel": 5,
    "maxLevel": 1,
    "effects": [
      {"stat": "maxHp", "type": "percent", "value": 20},
      {"stat": "damageReduction", "type": "flat", "value": 5}
    ],
    "description": "최대 HP +20%, 받는 피해 -5%",
    "icon": "warrior_passive.png"
  },
  "warrior_skill1": {
    "id": "warrior_skill1",
    "name": "돌진 베기",
    "type": "active",
    "unlockLevel": 10,
    "maxLevel": 5,
    "baseCooldown": 6,
    "manaCost": 30,
    "levels": [
      {"level": 1, "damage": 1.0, "cooldown": 7},
      {"level": 2, "damage": 1.1, "cooldown": 6.7},
      {"level": 3, "damage": 1.2, "cooldown": 6},
      {"level": 4, "damage": 1.3, "cooldown": 5.7},
      {"level": 5, "damage": 1.4, "cooldown": 5}
    ],
    "effect": {
      "type": "dash_attack",
      "distance": 300,
      "hitbox": "line"
    },
    "description": "전방 300px 돌진하며 경로상 적에게 피해",
    "icon": "warrior_skill1.png"
  }
}
```

### 13.7 맵 데이터 예시

#### beginners_forest.json
```json
{
  "id": "beginners_forest",
  "name": "초보자의 숲",
  "size": {
    "width": 8,
    "height": 8
  },
  "chunks": [
    {
      "x": 0,
      "y": 0,
      "tileset": "forest_tileset",
      "spawns": [
        {"monster": "slime_lv1", "x": 100, "y": 200, "respawn": 30},
        {"monster": "slime_lv1", "x": 300, "y": 400, "respawn": 30}
      ],
      "npcs": [
        {"id": "village_elder", "x": 512, "y": 512}
      ],
      "items": [
        {"id": "potion_hp_small", "x": 200, "y": 300}
      ]
    }
  ],
  "playerStart": {
    "x": 512,
    "y": 512
  }
}
```

### 13.8 데이터 관리 도구 (추후 개발)

**Phase 5 이후 개발 예정**
- **웹 기반 관리자 도구**: JSON 파일을 GUI로 편집할 수 있는 에디터
- **기능**:
  - 아이템 추가/수정/삭제
  - 몬스터 스탯 조정
  - 퀘스트 생성 및 편집
  - 드롭 테이블 설정
  - 맵 에디터 통합
  - 실시간 데이터 검증
  - 변경 사항 미리보기

### 13.9 데이터 로딩 시스템

```javascript
// 게임 시작 시 모든 데이터 로드
class DataManager {
  async loadAllData() {
    this.items = await this.loadJSON('assets/data/items/weapons.json');
    this.monsters = await this.loadJSON('assets/data/monsters/common.json');
    this.quests = await this.loadJSON('assets/data/quests/main_quests.json');
    // ... 기타 데이터
  }
  
  getItem(itemId) {
    return this.items[itemId];
  }
  
  getMonster(monsterId) {
    return this.monsters[monsterId];
  }
}
```

### 13.10 장점
✅ **코드 수정 불필요**: 새 아이템 추가 시 JSON만 수정  
✅ **밸런싱 용이**: 수치 조정이 간단하고 즉각 반영  
✅ **협업 효율**: 기획자가 직접 콘텐츠 제작 가능  
✅ **버전 관리**: Git으로 데이터 변경 이력 추적  
✅ **모드 지원**: 커뮤니티가 콘텐츠 추가 가능 (향후)  

---

## 14. 🎯 개발 우선순위

### Phase 1: 핵심 프로토타입 (1~2개월)
- [ ] Phaser 3 프로젝트 세팅
- [ ] 기본 이동 및 카메라 시스템
- [ ] 단일 맵 (1024×1024) 구현
- [ ] 1개 클래스 (검사) 구현
  - [ ] 기본 공격
  - [ ] 스킬 1개
- [ ] 기본 몬스터 1종 (슬라임)
  - [ ] 간단한 AI (추적, 공격)
- [ ] HP/MP 시스템
- [ ] 전투 피드백 (피해 숫자, 이펙트)

### Phase 2: 게임플레이 확장 (2~3개월)
- [ ] 청크 기반 동적 로딩 시스템
- [ ] 3개 지역 구현 (초보자의 숲, 황금 평원, 아르카나)
- [ ] 검사 전체 스킬 구현
- [ ] 3종 몬스터 추가 + AI 개선
- [ ] 레벨업 및 스탯 시스템
- [ ] 기본 인벤토리 시스템
- [ ] 아이템 드롭 및 습득
- [ ] 장비 착용 시스템

### Phase 3: RPG 시스템 (2~3개월)
- [ ] 나머지 3개 클래스 구현
- [ ] 전체 스킬 밸런싱
- [ ] 퀘스트 시스템 (메인 5개, 서브 10개)
- [ ] NPC 대화 시스템
- [ ] 상점 시스템 (4종)
- [ ] 강화 시스템
- [ ] 10종 이상 몬스터 추가
- [ ] 필드 보스 2종

### Phase 4: 콘텐츠 확장 (3~4개월)
- [ ] 전체 6개 지역 완성
- [ ] 레벨 50까지 컨텐츠
- [ ] 던전 시스템 (3개)
- [ ] 보스 전투 (페이즈 시스템)
- [ ] 일일 퀘스트
- [ ] 업적 시스템
- [ ] 타이틀 시스템
- [ ] 명성 시스템

### Phase 5: 완성 및 최적화 (1~2개월)
- [ ] 전체 밸런싱 조정
- [ ] 버그 수정
- [ ] 성능 최적화
- [ ] UI/UX 개선
- [ ] 사운드 및 BGM 추가
- [ ] 튜토리얼 완성
- [ ] 최종 테스트

### Phase 6: 멀티플레이 확장 (추후 결정)
- [ ] 서버 구조 설계
- [ ] 실시간 동기화
- [ ] 파티 시스템
- [ ] PvP 시스템
- [ ] 거래소
- [ ] 길드 시스템

---

## 15. 📌 기술 스택

### 프론트엔드
- **Phaser 3**: 게임 엔진
- **JavaScript/TypeScript**: 언어
- **Webpack**: 번들러

### 에셋
- **Tiled Map Editor**: 맵 제작
- **Aseprite**: 스프라이트 제작
- **BFXR**: 효과음 생성

### 개발 도구
- **VS Code**: IDE
- **Git**: 버전 관리
- **Chrome DevTools**: 디버깅

---

## 16. �️ 코드 아키텍처 및 모듈 구조

### 16.1 설계 원칙
- **단일 책임 원칙 (SRP)**: 각 클래스/모듈은 하나의 책임만 가짐
- **관심사의 분리 (SoC)**: 로직을 기능별로 명확히 분리
- **재사용성**: 중복 코드 최소화, 공통 로직을 유틸리티로 분리
- **확장성**: 새로운 기능 추가 시 기존 코드 수정 최소화
- **가독성**: 파일당 200~300 라인 이내 권장

### 16.2 프로젝트 폴더 구조

```
/src/
├── main.js                      # 게임 진입점
├── config/
│   ├── GameConfig.js            # Phaser 게임 설정
│   └── Constants.js             # 전역 상수
│
├── scenes/                      # Phaser Scene 관리
│   ├── BootScene.js             # 초기 로딩
│   ├── PreloadScene.js          # 에셋 프리로드
│   ├── MainMenuScene.js         # 메인 메뉴
│   ├── GameScene.js             # 메인 게임 씬
│   └── UIScene.js               # UI 오버레이 씬
│
├── entities/                    # 게임 엔티티 (캐릭터, 몬스터 등)
│   ├── Player.js                # 플레이어 클래스
│   ├── Monster.js               # 몬스터 베이스 클래스
│   ├── NPC.js                   # NPC 클래스
│   └── Projectile.js            # 투사체 클래스
│
├── characters/                  # 클래스별 캐릭터
│   ├── Warrior.js               # 검사
│   ├── Archer.js                # 아처
│   ├── Mage.js                  # 마법사
│   └── Rogue.js                 # 도적
│
├── skills/                      # 스킬 시스템
│   ├── SkillManager.js          # 스킬 관리자
│   ├── Skill.js                 # 스킬 베이스 클래스
│   ├── PassiveSkill.js          # 패시브 스킬
│   ├── ActiveSkill.js           # 액티브 스킬
│   └── skills/                  # 개별 스킬 구현
│       ├── WarriorDashSlash.js
│       ├── ArcherPiercingArrow.js
│       └── ...
│
├── combat/                      # 전투 시스템
│   ├── CombatManager.js         # 전투 관리
│   ├── DamageCalculator.js     # 데미지 계산
│   ├── StatusEffect.js          # 상태 이상
│   └── HitDetection.js          # 충돌 감지
│
├── ai/                          # 몬스터 AI
│   ├── AIController.js          # AI 제어 베이스
│   ├── BasicAI.js               # 기본 AI (일반 몬스터)
│   ├── EliteAI.js               # 정예 AI
│   └── BossAI.js                # 보스 AI
│
├── inventory/                   # 인벤토리 시스템
│   ├── InventoryManager.js      # 인벤토리 관리
│   ├── Item.js                  # 아이템 베이스 클래스
│   ├── Equipment.js             # 장비 클래스
│   └── Consumable.js            # 소모품 클래스
│
├── quest/                       # 퀘스트 시스템
│   ├── QuestManager.js          # 퀘스트 관리
│   ├── Quest.js                 # 퀘스트 클래스
│   └── QuestObjective.js        # 퀘스트 목표
│
├── map/                         # 맵 관리
│   ├── MapManager.js            # 맵 전체 관리
│   ├── ChunkLoader.js           # 청크 로딩 시스템
│   ├── Chunk.js                 # 청크 클래스
│   └── SpawnManager.js          # 몬스터/NPC 스폰
│
├── ui/                          # UI 시스템
│   ├── UIManager.js             # UI 전체 관리
│   ├── HUD.js                   # HUD 관리
│   ├── InventoryUI.js           # 인벤토리 UI
│   ├── SkillUI.js               # 스킬 UI
│   ├── QuestUI.js               # 퀘스트 UI
│   ├── MapUI.js                 # 월드맵 UI
│   └── components/              # UI 컴포넌트
│       ├── Button.js
│       ├── Tooltip.js
│       ├── ProgressBar.js
│       └── Popup.js
│
├── managers/                    # 시스템 관리자들
│   ├── DataManager.js           # 데이터 로딩/관리
│   ├── SaveManager.js           # 저장/로드
│   ├── InputManager.js          # 입력 처리
│   ├── SoundManager.js          # 사운드 관리
│   ├── ParticleManager.js       # 파티클 효과
│   └── CameraManager.js         # 카메라 제어
│
├── utils/                       # 유틸리티 함수
│   ├── MathUtils.js             # 수학 유틸
│   ├── ArrayUtils.js            # 배열 유틸
│   ├── StringUtils.js           # 문자열 유틸
│   ├── ColorUtils.js            # 색상 유틸
│   └── DebugUtils.js            # 디버깅 유틸
│
└── types/                       # TypeScript 타입 정의 (TS 사용 시)
    ├── Character.d.ts
    ├── Item.d.ts
    └── Quest.d.ts
```

### 16.3 모듈화 예시

#### 16.3.1 Player.js (플레이어 클래스)
```javascript
// src/entities/Player.js
import { Entity } from './Entity.js';
import { InventoryManager } from '../inventory/InventoryManager.js';
import { SkillManager } from '../skills/SkillManager.js';

export class Player extends Entity {
  constructor(scene, x, y, characterClass) {
    super(scene, x, y);
    
    this.characterClass = characterClass;
    this.inventory = new InventoryManager(this);
    this.skillManager = new SkillManager(this, characterClass);
    
    this.initStats();
    this.setupControls();
  }
  
  initStats() {
    // 스탯 초기화 (별도 파일에서 로드)
    const classData = this.scene.dataManager.getClassData(this.characterClass);
    this.stats = { ...classData.baseStats };
  }
  
  update(delta) {
    this.handleMovement(delta);
    this.skillManager.update(delta);
    this.updateAnimations();
  }
  
  handleMovement(delta) {
    // 이동 로직만 담당 (200줄 이하로 유지)
  }
}
```

#### 16.3.2 SkillManager.js (스킬 관리)
```javascript
// src/skills/SkillManager.js
import { DataManager } from '../managers/DataManager.js';

export class SkillManager {
  constructor(owner, characterClass) {
    this.owner = owner;
    this.characterClass = characterClass;
    this.skills = new Map();
    this.cooldowns = new Map();
    
    this.loadSkills();
  }
  
  async loadSkills() {
    const skillData = await DataManager.getInstance()
      .getSkills(this.characterClass);
    
    for (const [id, data] of Object.entries(skillData)) {
      const SkillClass = await import(`./skills/${data.className}.js`);
      this.skills.set(id, new SkillClass.default(this.owner, data));
    }
  }
  
  useSkill(skillId) {
    if (this.isOnCooldown(skillId)) return false;
    
    const skill = this.skills.get(skillId);
    if (skill && skill.canUse()) {
      skill.execute();
      this.startCooldown(skillId, skill.cooldown);
      return true;
    }
    return false;
  }
  
  update(delta) {
    this.updateCooldowns(delta);
  }
}
```

#### 16.3.3 DamageCalculator.js (피해 계산 분리)
```javascript
// src/combat/DamageCalculator.js
export class DamageCalculator {
  static calculatePhysicalDamage(attacker, defender, skillMultiplier = 1.0) {
    const attack = attacker.stats.physicalAttack;
    const defense = defender.stats.defense;
    
    const baseDamage = Math.max(1, attack - defense * 0.5);
    const finalDamage = baseDamage * skillMultiplier;
    
    // 치명타 체크
    if (this.isCritical(attacker.stats.critChance)) {
      return finalDamage * attacker.stats.critDamage;
    }
    
    return finalDamage;
  }
  
  static calculateMagicalDamage(attacker, defender, skillMultiplier = 1.0) {
    const magicAttack = attacker.stats.magicAttack;
    const magicResist = defender.stats.magicResist || 0;
    
    return magicAttack * skillMultiplier * (1 - magicResist);
  }
  
  static isCritical(critChance) {
    return Math.random() < critChance / 100;
  }
}
```

#### 16.3.4 ChunkLoader.js (청크 로딩 분리)
```javascript
// src/map/ChunkLoader.js
export class ChunkLoader {
  constructor(scene) {
    this.scene = scene;
    this.loadedChunks = new Map();
    this.chunkSize = 1024;
  }
  
  async loadChunk(chunkX, chunkY) {
    const key = `${chunkX}_${chunkY}`;
    
    if (this.loadedChunks.has(key)) {
      return this.loadedChunks.get(key);
    }
    
    const chunkData = await this.scene.dataManager
      .getChunkData(chunkX, chunkY);
    
    const chunk = new Chunk(this.scene, chunkX, chunkY, chunkData);
    chunk.load();
    
    this.loadedChunks.set(key, chunk);
    return chunk;
  }
  
  unloadChunk(chunkX, chunkY) {
    const key = `${chunkX}_${chunkY}`;
    const chunk = this.loadedChunks.get(key);
    
    if (chunk) {
      chunk.destroy();
      this.loadedChunks.delete(key);
    }
  }
  
  updateVisibleChunks(playerX, playerY) {
    const centerChunkX = Math.floor(playerX / this.chunkSize);
    const centerChunkY = Math.floor(playerY / this.chunkSize);
    
    // 5x5 청크 로드
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        this.loadChunk(centerChunkX + x, centerChunkY + y);
      }
    }
    
    // 멀리 있는 청크 언로드
    this.unloadDistantChunks(centerChunkX, centerChunkY);
  }
}
```

### 16.4 싱글톤 패턴 (전역 관리자)

```javascript
// src/managers/DataManager.js
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
    
    this.items = null;
    this.monsters = null;
    this.quests = null;
  }
  
  async loadAllData() {
    this.items = await this.loadJSON('/assets/data/items/weapons.json');
    this.monsters = await this.loadJSON('/assets/data/monsters/common.json');
    this.quests = await this.loadJSON('/assets/data/quests/main_quests.json');
  }
  
  async loadJSON(path) {
    const response = await fetch(path);
    return await response.json();
  }
}
```

### 16.5 이벤트 기반 통신

```javascript
// src/utils/EventBus.js
export class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(callback);
  }
  
  emit(eventName, data) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
  
  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }
}

// 사용 예시
// eventBus.emit('player:levelUp', { level: 25 });
// eventBus.on('monster:killed', (data) => { ... });
```

### 16.6 모듈 임포트 규칙

```javascript
// ❌ 나쁜 예: 순환 참조
// Player.js
import { Monster } from './Monster.js';

// Monster.js
import { Player } from './Player.js'; // 순환 참조!

// ✅ 좋은 예: 공통 베이스 클래스 사용
// Entity.js (베이스)
export class Entity { ... }

// Player.js
import { Entity } from './Entity.js';
export class Player extends Entity { ... }

// Monster.js
import { Entity } from './Entity.js';
export class Monster extends Entity { ... }
```

### 16.7 코드 스타일 가이드

```javascript
// 1. 파일당 하나의 클래스/모듈
// 2. 클래스명은 PascalCase
// 3. 함수/변수명은 camelCase
// 4. 상수는 UPPER_SNAKE_CASE
// 5. 함수는 한 가지 일만 수행 (50줄 이내 권장)

// ✅ 좋은 예
class InventoryManager {
  addItem(item) { ... }           // 명확한 단일 책임
  removeItem(itemId) { ... }      // 명확한 단일 책임
  findItemById(id) { ... }        // 명확한 단일 책임
}

// ❌ 나쁜 예
class GameManager {
  handleEverything() {
    // 300줄의 모든 로직...
  }
}
```

### 16.8 장점
✅ **유지보수성**: 버그 수정 시 해당 모듈만 확인  
✅ **테스트 용이**: 각 모듈을 독립적으로 테스트  
✅ **협업 효율**: 여러 개발자가 다른 파일을 동시에 작업  
✅ **재사용성**: 공통 로직을 여러 곳에서 재사용  
✅ **확장성**: 새 기능 추가 시 기존 코드 영향 최소화  

---

## 17. �🎮 프로젝트 목표
1. **PC 브라우저에서 원활하게 작동**하는 2D 액션 RPG 완성
2. **30~50시간** 플레이 분량의 싱글플레이 콘텐츠
3. 향후 **멀티플레이 확장 가능**한 구조 설계
4. **청크 기반 오픈월드**로 성능과 광활함 동시 달성

---

**개발 시작일**: 2025년 12월 14일  
**목표 완성일**: Phase 5 완료 기준 약 12~14개월

> "에테르 차원의 진실을 밝혀라!"