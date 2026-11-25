---
title: "哈希表"
summary: "哈希表：桶、哈希码与压缩、冲突、拉链法（负载因子）、线性探测（墓碑、主聚集、探测次数与扩容）以及二次探测。"
topics:
  - hashing
kind: "topic"
order: 508
---

# 信息与计算机科学 46 — 话题：哈希表

## 目录

- [1. 哈希表的思想](#1-哈希表的思想)
- [2. 哈希函数：哈希码 + 压缩](#2-哈希函数哈希码--压缩)
- [3. 冲突](#3-冲突)
- [4. 拉链法（Separate Chaining）](#4-拉链法separate-chaining)
- [5. 线性探测（Linear Probing）](#5-线性探测linear-probing)
- [6. 二次探测（Quadratic Probing）](#6-二次探测quadratic-probing)
- [7. 完整实现](#7-完整实现)
- [8. 速查与五个要点](#8-速查与五个要点)

> UCI ICS 46：数据结构的实现与分析 — Tom Yeh 教授。本笔记把第 14–15 讲中的哈希表内容汇集在一起，按概念组织。

## 1. 哈希表的思想

平衡 BST 可以得到 O(log n)，并按序保存键（见 [搜索树](topic-search-trees.zh-CN.md)）。**哈希表**旨在让键值对的查找、插入和删除达到 **平均 O(1)**；代价是键不再有序。

Yeh 的类比：在一堆衣服里找一件衬衫，可以翻遍这堆无序的衣服（无序列表），也可以把衣服两两比较并建成一棵树（BST）。而实际做法是**把衣服放进抽屉**。物品本身的信息告诉你**放在哪里**，之后也告诉你**去哪里找**：哈希表在每次操作中都利用数据本身的线索来决定位置。

结构：由大量称为**桶**（`[0] … [m-1]`）的小集合组成，它们共同构成哈希表；再加上一条**规则——哈希函数**，把每个元素映射到它所在的桶（衬衫 → 哈希函数 → 3，即衬衫抽屉；毛衣 0、夹克 1、裤子 2、衬衫 3、袜子 4）。要找某个东西，只需查看它所在的桶。

## 2. 哈希函数：哈希码 + 压缩

- **哈希函数**：生成哈希表的索引。目标：**均匀哈希**（尽量减少冲突）。
- **第一步，哈希码**：把输入转换为整数，并尽量均匀地分散数据。
- **第二步，压缩（取模）**：把哈希码映射为合法的桶索引，即 `hash_code % num_buckets`。

**第一次尝试**：`hash_value = hash(input)`，其中 `hash = len(input)`，例如 "Prof Yeh" → 8。问题是：8 不是一个桶——只有 5 个桶，因此这个值必须被压缩到索引范围之内。

**第二次尝试，分两部分**：

1. `hashCode()` 把输入映射为一个整数（**哈希码**）；
2. **压缩**把哈希码映射到桶的范围内：**`hash = hashCode(input) % numBuckets`**。

插入与查找使用的是同一个函数。取 5 个桶，并以 `len` 作为哈希码：

| 输入 | hashCode = len | % 5 | 桶 |
|---|---|---|---|
| "Prof Yeh" | 8 | 8 % 5 | 3 |
| "Students" | 8 | 8 % 5 | 3 |

> 📘 **课外补充**：一个好的哈希函数应当是**确定性的**（相等的键得到相同的哈希值）、**快速的**，并且把键**均匀分布**到 0 … m−1 上。`len` 在最后一点上表现很差。对于整数键，常用的选择是**取模哈希** `k % m`，其中 **m 为素数**，这样键中的规律就不会与 m 对齐。（algs4 §3.4；Thornton 的信用卡例子展示了有偏的数字如何破坏哈希。）

> ⚠️ **易错点**：在 C++（与 Java 一样）中，负数的 `%` 结果是负数，因此 `hashCode(key) % m` 可能得到 −2 这样的索引。应使用无符号哈希（例如 `std::hash` 返回 `size_t`），或在索引前修正符号。

## 3. 冲突

当多个元素哈希到同一个桶时发生**冲突**："Prof Yeh" 与 "Students" 都落在桶 3 中（类比：找到自己的座位时，座位上已经有人坐了）。一般而言冲突无法避免——可能的键远多于桶的数量，即使在均匀哈希的假设下也会发生——因此哈希表需要冲突解决策略。基本问题是：如何让一个桶容纳多个元素，以及哪种结构能使插入变快：为每个桶配一个链表。共有三种方法：

| 方法 | 思路 | 技术 |
|---|---|---|
| 1 | 允许每个桶中存放多个元素 | **拉链法** |
| 2 | 溢出到其他桶 | **线性探测**（以及二次探测） |
| 3 | 把已有数据踢出 | **布谷鸟哈希** |

第 4–6 节分别介绍拉链法、线性探测和二次探测。

## 4. 拉链法（Separate Chaining）

### 4.1 结构与跟踪

**结构**：一个**链表数组**（或数组列表的数组）。哈希值直接索引到正确的桶，每个数组元素（桶）保存一个链表的**头指针**。设共有 b 个桶：

1. **哈希**：把键映射为 0 到 b − 1 之间的整数 i。
2. **插入**：如果第 i 条链中**尚不存在**该项，则把它加入——这需要先扫描该链以检查重复（若键已存在，则更新其值）。
3. **查找**：只在第 i 条链中查找。

下面是 b = 5 个桶的跟踪，其中"值"为插入序号，新节点加在所在链的**头部**：

| 键 | S | E | A | R | C | H | E | X | A | M | P | L | E |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 哈希 | 2 | 0 | 0 | 4 | 4 | 4 | 0 | 2 | 0 | 4 | 3 | 3 | 0 |
| 序号 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

第二个 E（序号 6）、第二个 A（序号 8）和第三个 E（序号 12）是**更新**，而不是新节点。最终的表为：0: A,8 → E,12 · 1: 空 · 2: X,7 → S,0 · 3: L,11 → P,10 · 4: M,9 → H,5 → C,4 → R,3。可以逐步查看，也可以输入自己的键，或切换到探测（演示区域获得焦点时，← / → 键可用）：

```viz hash-table
{"title": "拉链法，m = 5", "m": 5, "hashes": "S:2, E:0, A:0, R:4, C:4, H:4, X:2, M:4, P:3, L:3", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(E); put(X); put(A); put(M); put(P); put(L); put(E)", "interactive": true}
```

### 4.2 实现

幻灯片中的代码（未给出 `hashFunction`；它就是哈希码 % m）：

```cpp
template <typename Key, typename Value>
class SeparateChaining {
private:
  struct Node {
    Key key;
    Value val;
    Node* next;
  };
  static const int m = 128; // hash table size
  Node* dict[m]; // array of linked lists
public:
  Value get(const Key& key) const {
    int i = hashFunction(key); // compute hash value
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) return x->val; // return when found
    }
    return Value();
  }
  void put(const Key& key, const Value& val) {
    int i = hashFunction(key);
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) { x->val = val; return; }
    }
    dict[i] = new Node{key, val, dict[i]}; // insert at head
  }
};
```

`put` 先扫描链（若找到则更新），然后把新节点链接到头部：它的 `next` 指向旧的头 `dict[i]`，而 `dict[i]` 随后指向新节点——扫描之后为 O(1)。

> ⚠️ **易错点**：幻灯片中的错误（按幻灯片上的代码）：`dict[m]` 从未初始化，因此各链起始时是垃圾指针而不是 `nullptr`——应写成 `Node* dict[m] = {};`。注意 `new Node{key, val, dict[i]}` 中的花括号：`Node` 是没有构造函数的聚合类型，所以 `new Node(key, val, dict[i])` 在 C++17 中无法编译。（[§7](#7-完整实现) 给出了修正、`remove` 以及析构函数。）

使用拉链法删除很简单：在第 i 条链中找到节点，并像链表一样把它断开；其他任何东西都不会移动。

### 4.3 分析：负载因子

**最坏情况 O(n)**：所有值都哈希到同一个桶，此时你需要遍历那一条链。**平均情况取决于哈希函数的强度**。对于能把 n 个元素均匀分布到 m 个桶中的强哈希函数：

- 平均而言，每个桶中有 **n / m** 个元素；
- 查找和插入的平均代价为 **n / m**——与对单个列表做顺序查找相比，每次查找探测的键大约少了 m 倍。

**n / m 即负载因子**：它告诉我们哈希表的满载程度。要使查找和插入达到 **O(1)**，应选择与 n 成比例的 m，使 n / m 保持为常数（随着 n 增长而调整数组大小）。这样，平均查找和插入时间就是常数。

- 负载因子过高（m 过小）→ 链很长，操作变慢；
- 负载因子过低（m 过大）→ 内存浪费，大量空链。

**有序操作**（最小值、最大值、按序输出的键、区间查询）**不被支持**——对这些操作请使用（平衡的）BST（见 [搜索树](topic-search-trees.zh-CN.md)）。插入、查找和删除的平均情况为 O(1)；最坏情况为 O(n)。

> 📘 **课外补充**：负载因子在两类方法中的含义不同。在拉链法中，α = n/m 是平均链长，可以大于 1（每个桶 10 个键仍然可用，只是更慢）。在线性探测或二次探测中，每个键都需要自己的槽位，因此 α 是数组中被占用的比例，**必须保持小于 1**。（algs4 §3.4）

### 4.4 练习

#### 拉链法，m = 7

依据以下规则与输入，使用拉链法执行哈希表操作。给出任务 A 之后与任务 C 之后的状态。

**系统参数**：实现策略为拉链法；哈希表大小 **m = 7**；整数键 k 的哈希函数为 **h(k) = k % m**。

**任务 A — 插入键值对**：按顺序插入以下键值对，并给出得到的字典：(47, 0)、(3, 1)、(28, 2)、(14, 3)、(9, 4)、(47, 5)。

**任务 B — 查找操作**：查找键 28 和 47 各需要多少次比较？

**任务 C — 删除操作**：删除键 14。

> 提示：新节点加在链的头部，并且 47 出现了两次。

<details>
<summary>解答</summary>

哈希值：47 % 7 = 5，3 % 7 = 3，28 % 7 = 0，14 % 7 = 0，9 % 7 = 2。

**任务 A 之后**——第二个 (47, 5) 在链 5 中找到 47 并**更新**其值；14 放在 28 前面：

| 桶 | 链（头部在前） |
|---|---|
| 0 | (14, 3) → (28, 2) |
| 1 | — |
| 2 | (9, 4) |
| 3 | (3, 1) |
| 4 | — |
| 5 | (47, 5) |
| 6 | — |

**任务 B**：查找 28 → 链 0，先与 14 比较，再与 28 比较：**2 次比较**。查找 47 → 链 5，与 47 比较：**1 次比较**。

**任务 C 之后**：链 0 变为 (28, 2)；其他部分保持不变。验证如下：

```viz hash-table
{"title": "拉链法检查", "m": 7, "ops": "put(47, 0); put(3, 1); put(28, 2); put(14, 3); put(9, 4); put(47, 5); get(28); get(47); remove(14)"}
```

</details>

## 5. 线性探测（Linear Probing）

### 5.1 插入与查找

**线性探测**把所有键都保存在数组本身中——当一个桶被占用时，**溢出到下一个位置**（这一类方法称为*开放寻址*）：

- **插入**：要插入 x，计算 h(x) 并尝试把 x 放在那里。如果该位置已满，则在数组中逐个位置继续移动，**绕回末尾**，直到找到空位。
- **查找**：计算 h(x) 并从那里开始查找。沿环移动，**直到找到元素或检测到空位**——空位证明 x 不在表中，因为插入时 x 本会被放在那里。
- 使用负载因子 n/m 来防止表被填满到容量上限。

可以把表想象为由 m = 16 个槽组成的环，槽中存放 z (2)、x (7)、w (8)、r (9) 和 y (14)。**查找 h(a) = 8 的 a**（在插入 b 之前）：8（w）、9（r）、10 为空 → a 不在表中。**插入 h(b) = 7 的 b**：槽 7、8、9 已满，因此 b 放入槽 10。演示假设 h(w) = 7、h(r) = 8（图中只画出了它们最终的位置），这与该图是一致的：

```viz hash-table
{"title": "环形 16 槽上的线性探测", "mode": "linear", "m": 16, "hashes": "z:2, x:7, w:7, r:8, y:14, b:7, a:8", "ops": "put(z); put(x); put(w); put(r); put(y); get(a); put(b); remove(w); get(r)", "interactive": true}
```

> 📘 **课外补充**：Thornton 的 ICS 46 笔记是**向后**探测（i − 1、i − 2、……）。只要插入、查找和删除使用相同的探测序列，任一方向都可以；Yeh 的幻灯片和 algs4 则是向前移动，即 (h + i) % m。

### 5.2 删除：墓碑

删除比拉链法更棘手。简单地查找元素并清空其槽位会造成问题：**删除 w，然后查找 r**。r 被放在槽 9，因为槽 8 已被 w 占用；如果槽 8 现在为空，那么从 8 开始对 r 的查找就会在那里停止，并错误地报告 r 不存在。

解决办法：**墓碑**——区分*已删除*与*空*。

- 删除元素时，把该单元标记为**空但曾被占用**（墓碑）。
- 查找时，**不要在墓碑处停止**——继续向下查找。
- 插入时可以**替换墓碑**（复用该槽位）。

在上面的演示中，最后两个操作先删除 w（槽 8 变为 †），然后通过越过墓碑来查找 r。

> ⚠️ **易错点**：墓碑对于*查找*而言不是空的，但对于*插入*而言是可用的。如果在墓碑处停止查找，你会丢失键；如果从不复用墓碑，表会被墓碑填满（重新哈希到新数组会清除它们）。

### 5.3 实际表现：速度与主聚集

线性探测是**最快的通用哈希策略之一**：

- **内存开销低**：只需要一个数组和一个哈希函数（没有节点，没有 `next` 指针）；
- **局部性极好**：查找访问的是相邻的位置；
- **缓存性能出色**：上述两者结合的结果。

它的弱点是**主聚集**。**聚集**是一段连续被占用的槽位。新键很可能哈希到**大聚集的中部**（大聚集就是大目标），而每个这样的键都会被放在聚集的末尾，使它变得更大——因此冲突数量会随着已有冲突的增多而增长。

### 5.4 时间分析与扩容

在均匀哈希假设下，设负载因子 **α = n/m**（n 为输入规模，m 为表的大小），平均探测次数为（Knuth 1963）：

- 查找命中：½ (1 + 1 / (1 − α))
- 查找未命中与插入：½ (1 + 1 / (1 − α)²)

这些公式只在 α < 1 时有意义。α = ½ 以及接近 1 时的情况如下：

| α | 查找命中 | 查找未命中 / 插入 |
|---|---|---|
| 1/2 | 1.5 次探测 | 2.5 次探测 |
| 0.9 | 5.5 次探测 | 50.5 次探测 |

接近满表时，未命中的代价急剧增长。**典型选择：n/m = ½**——平均每次操作的工作量为常数。通过在 n/m ≥ ½ 时**加倍**表的大小、在 n/m ≤ ⅛ 时**减半**表的大小来维持这一比例。

改变哈希表大小的代价是多少？每个键的槽位都依赖于 m（`hash % m`），因此扩容必须把**每个键都重新哈希**到新数组中——这一次操作为 O(n)。由于大小每次加倍或减半（与 ArrayList 相同），这一代价会分摊到导致它的那些操作上：每次操作**均摊 O(1)**。

> 📘 **课外补充**：你不能把旧数组逐个槽位地复制到更大的数组中——键会停留在它们旧的 `% m` 位置上，而用新的 m 进行的查找会找不到它们。重新哈希还会丢弃所有墓碑。（Thornton, Hash Tables）

### 5.5 练习

#### 带删除的线性探测

m = 13，h(x) = x mod 13。依次插入键 18、3、16、22、21、8；删除 16，删除 21；查找 8；插入 20、7。（填写一个包含 13 个槽、索引为 0–12 的表。）

> 提示：删除会留下墓碑，而查找 8 必须越过其中一个。

<details>
<summary>解答</summary>

插入：18 → 5；3 → 3；16 → 3 已占用 → **4**；22 → 9；21 → 8；8 → 8 已占用，9 已占用 → **10**。

| 槽 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 插入后 | | | | 3 | 16 | 18 | | | 21 | 22 | 8 | | |
| 删除后 | | | | 3 | † | 18 | | | † | 22 | 8 | | |
| 最终 | | | | 3 | † | 18 | | 20 | 7 | 22 | 8 | | |

删除 16 和 21 → 在槽 4 和槽 8 处留下墓碑（†）。**查找 8**：槽 8 是墓碑（继续查找），槽 9 中是 22，槽 10 中是 8 → **3 次探测后找到**。如果没有墓碑，查找会在空槽 8 处停止，并错误地判定未找到。

插入 20 → 槽 7（空）。插入 7 → 槽 7 中已有 20；槽 8 是墓碑，因此 **7 复用槽 8**。（审慎的插入会先检查 7 是否已存在于更远处——9、10，然后是空的 11——再使用墓碑；结果是相同的。）

```viz hash-table
{"title": "线性探测检查", "mode": "linear", "m": 13, "ops": "put(18); put(3); put(16); put(22); put(21); put(8); remove(16); remove(21); get(8); put(20); put(7)"}
```

</details>

## 6. 二次探测（Quadratic Probing）

### 6.1 探测序列

修改探测序列，使得

**h(k, i) = (h(k) + c₁·i + c₂·i²) % m，其中 c₂ ≠ 0**，i 是该键迄今为止发生的冲突次数（i = 0 为第一次尝试）。

当 c₂ = 0 时，二次探测退化为线性探测。跳跃的距离逐渐增大（在 c₁ = 0、c₂ = 1 时，相对于初始槽位的偏移依次为 1、4、9、……），因此发生冲突的键不会全部堆积到同一段连续的聚集上。查找和删除使用**相同的探测序列**和**墓碑**，与线性探测完全一样。

> ⚠️ **易错点**：探测序列不一定会访问每一个槽位。当 h(k, i) = (h(k) + i²) % 13 时，偏移量 i² % 13 只取 7 个不同的值（0, 1, 3, 4, 9, 10, 12），因此即使表中仍有空槽，插入也可能失败——这是保持低负载因子的另一个理由。

### 6.2 练习

#### 带删除的二次探测

h(k) = k % m，且 h(k, i) = (h(k) + i²) % m。假设 m = 13，要插入的键值对为：(17,0)、(33,1)、(18,2)、(20,3)、(44,4)、(11,5)、(19,6)、(7,7)。（17 落在槽 4。）

初始插入之后：删除 44；查找 19；插入 5。

注意，(17,0) 中的值指的是 (key, value)；i 是统计冲突次数的变量。

> 提示：19 和 7 各自需要不止一次冲突；对于 7，第四次尝试（i = 3）会绕回。

<details>
<summary>解答</summary>

| 键 | h(k) | 探测（i = 0, 1, 2, …） | 槽 |
|---|---|---|---|
| 17 | 4 | 4 | 4 |
| 33 | 7 | 7 | 7 |
| 18 | 5 | 5 | 5 |
| 20 | 7 | 7 ✗, 8 | 8 |
| 44 | 5 | 5 ✗, 6 | 6 |
| 11 | 11 | 11 | 11 |
| 19 | 6 | 6 ✗, 7 ✗, 10 | 10 |
| 7 | 7 | 7 ✗, 8 ✗, 11 ✗, 16 % 13 = 3 | 3 |

插入之后：3: (7,7) · 4: (17,0) · 5: (18,2) · 6: (44,4) · 7: (33,1) · 8: (20,3) · 10: (19,6) · 11: (11,5)。

- **删除 44**：探测 5（18）、6（44）→ 槽 6 变为**墓碑**。
- **查找 19**：6 是墓碑（继续查找），7（33），10（19）→ **3 次探测后找到**。
- **插入 5**：h = 5 处为 18；i = 1 → 槽 6 是墓碑 → **5 放入槽 6**。

```viz hash-table
{"title": "二次探测检查", "mode": "quadratic", "m": 13, "ops": "put(17, 0); put(33, 1); put(18, 2); put(20, 3); put(44, 4); put(11, 5); put(19, 6); put(7, 7); remove(44); get(19); put(5)"}
```

</details>

## 7. 完整实现

`SeparateChaining` 遵循幻灯片中的代码，并加入了 `dict` 的修正、一个 `remove`，以及与拉链法练习相匹配的 m = 7。`LinearProbing` 不来自幻灯片（幻灯片未给出代码）：整数键，h(k) = k % 13，墓碑用 `DELETED` 状态表示。

```cpp
#include <iostream>
#include <functional>
#include <string>

template <typename Key, typename Value>
class SeparateChaining {
private:
    struct Node {
        Key key;
        Value val;
        Node* next;
    };
    static const int m = 7;          // hash table size (slides: 128)
    Node* dict[m] = {};              // array of linked lists, all nullptr

    int hashFunction(const Key& key) const {
        return std::hash<Key>{}(key) % m;   // hashCode, then compress to 0..m-1
    }
public:
    SeparateChaining() = default;
    SeparateChaining(const SeparateChaining&) = delete;
    SeparateChaining& operator=(const SeparateChaining&) = delete;
    ~SeparateChaining() {
        for (int i = 0; i < m; i++)
            while (dict[i]) { Node* x = dict[i]; dict[i] = x->next; delete x; }
    }

    Value get(const Key& key) const {
        int i = hashFunction(key); // compute hash value
        for (Node* x = dict[i]; x != nullptr; x = x->next) {
            if (x->key == key) return x->val; // return when found
        }
        return Value();
    }

    void put(const Key& key, const Value& val) {
        int i = hashFunction(key);
        for (Node* x = dict[i]; x != nullptr; x = x->next) {
            if (x->key == key) { x->val = val; return; }
        }
        dict[i] = new Node{key, val, dict[i]}; // insert at head
    }

    void remove(const Key& key) {
        int i = hashFunction(key);
        Node** p = &dict[i];                       // the link that may need fixing
        while (*p != nullptr && (*p)->key != key) p = &(*p)->next;
        if (*p != nullptr) { Node* x = *p; *p = x->next; delete x; }
    }

    void print() const {
        for (int i = 0; i < m; i++) {
            std::cout << i << ':';
            for (Node* x = dict[i]; x != nullptr; x = x->next)
                std::cout << " (" << x->key << ',' << x->val << ')';
            std::cout << '\n';
        }
    }
};

// Linear probing with tombstones (int keys, h(k) = k % m).
class LinearProbing {
    static const int m = 13;
    enum State { EMPTY, FULL, DELETED };
    int keys[m];
    int vals[m];
    State state[m] = {};             // all EMPTY

    int hash(int key) const { return key % m; }
public:
    // returns the slot holding key, or -1; counts probes
    int find(int key, int& probes) const {
        int h = hash(key);
        probes = 0;
        for (int i = 0; i < m; i++) {
            int s = (h + i) % m;           // quadratic: (h + i * i) % m
            probes++;
            if (state[s] == EMPTY) return -1;            // blank spot: stop
            if (state[s] == FULL && keys[s] == key) return s;
            // DELETED (tombstone) or another key: keep going
        }
        return -1;
    }
    void put(int key, int val) {
        int h = hash(key), firstFree = -1;
        for (int i = 0; i < m; i++) {
            int s = (h + i) % m;
            if (state[s] == FULL && keys[s] == key) { vals[s] = val; return; }
            if (state[s] != FULL && firstFree < 0) firstFree = s;   // tombstone or empty
            if (state[s] == EMPTY) break;
        }
        if (firstFree < 0) return;        // table full (resize long before this)
        keys[firstFree] = key; vals[firstFree] = val; state[firstFree] = FULL;
    }
    void remove(int key) {
        int probes;
        int s = find(key, probes);
        if (s >= 0) state[s] = DELETED;   // tombstone, not EMPTY
    }
    void print() const {
        for (int s = 0; s < m; s++)
            std::cout << (state[s] == FULL ? std::to_string(keys[s]) : state[s] == DELETED ? "X" : ".") << ' ';
        std::cout << '\n';
    }
};

int main() {
    SeparateChaining<int, int> t;
    int pairs[][2] = {{47,0},{3,1},{28,2},{14,3},{9,4},{47,5}};
    for (auto& p : pairs) t.put(p[0], p[1]);
    t.print();
    std::cout << "get(28) = " << t.get(28) << ", get(47) = " << t.get(47) << '\n';
    t.remove(14);
    std::cout << "after remove(14):\n"; t.print();

    LinearProbing lp;
    for (int k : {18, 3, 16, 22, 21, 8}) lp.put(k, 0);
    lp.print();
    lp.remove(16); lp.remove(21);
    lp.print();
    int probes; int s = lp.find(8, probes);
    std::cout << "find(8): slot " << s << ", " << probes << " probes\n";
    lp.put(20, 0); lp.put(7, 0);
    lp.print();
}
```

输出（`X` = 墓碑，`.` = 空）：

```text
0: (14,3) (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
get(28) = 2, get(47) = 5
after remove(14):
0: (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
. . . 3 16 18 . . 21 22 8 . . 
. . . 3 X 18 . . X 22 8 . . 
find(8): slot 10, 3 probes
. . . 3 X 18 . 20 7 22 8 . . 
```

## 8. 速查与五个要点

| | 拉链法 | 线性探测 | 二次探测 |
|---|---|---|---|
| 存储 | m 个链表的数组 | 一个数组，键存放在槽中 | 一个数组 |
| 冲突时 | 加入链（在头部） | 尝试 (h + i) % m | 尝试 (h + i²) % m |
| 查找停止于 | 链 i 的末尾 | 该键或一个**空**槽 | 该键或一个空槽 |
| 删除 | 断开节点 | 墓碑 | 墓碑 |
| 负载因子 α = n/m | 平均链长，可能 > 1 | 必须 < 1；保持约为 ½ | 必须 < 1 |
| 平均 / 最坏 | O(1) / O(n) | O(1) / O(n) | O(1) / O(n) |

**必记的 5 个要点**

1. 拉链法：`i = hash(key) % m`，扫描链 i（若键已存在则更新），否则在头部插入新节点；查找只在链 i 中进行。
2. 平均代价与负载因子 n/m 成正比；通过随 n 增长而增大 m 来保持其为常数（探测时在 ½ 处加倍、在 ⅛ 处减半）；扩容意味着对每个键重新哈希——一次性 O(n)，均摊 O(1)。
3. 线性探测的查找只在该键或一个空槽处停止，因此删除必须留下墓碑；查找会跳过墓碑，插入可以复用它们。
4. 线性探测在实践中很快（内存、局部性、缓存），但存在主聚集的问题；命中的探测次数约为 ½(1 + 1/(1−α))，未命中约为 ½(1 + 1/(1−α)²)，因此应保持 α ≈ ½。
5. 二次探测使用 (h(k) + c₁i + c₂i²) % m，其中 c₂ ≠ 0（c₂ = 0 即线性探测）；哈希表平均为 O(1)，但最坏为 O(n)，且不支持有序操作。
