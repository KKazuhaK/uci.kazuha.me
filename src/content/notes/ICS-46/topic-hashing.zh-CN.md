---
title: "哈希表"
summary: "哈希表：桶、哈希码与压缩、冲突、拉链法（负载因子、重新哈希）、线性探测（墓碑、主聚集、探测次数、扩容）以及二次探测。"
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

> 本章从思想出发，逐步构建哈希表：哈希函数、冲突，以及两类冲突解决方法（拉链法，和使用线性探测、二次探测的开放寻址），并附完整的 C++ 代码。本章假定读者已经了解数组与链表（[线性结构](topic-linear.zh-CN.md)）和大 O 分析（[分析](topic-analysis.zh-CN.md)），并以平衡搜索树的字典操作作为比较对象（[搜索树](topic-search-trees.zh-CN.md)）。

## 1. 哈希表的思想

平衡 BST 的查找、插入和删除都是 O(log n)，并且按序保存键（[搜索树](topic-search-trees.zh-CN.md)）。**哈希表**的目标是让键值对的查找、插入和删除达到**平均 O(1)**；代价是键不再有序。

打个比方：要在一堆衣服里找一件衬衫，可以逐件翻找这堆无序的衣服（无序列表），也可以把衣服两两比较并建成一棵树（BST）。而实际做法是**把衣服放进抽屉**。物品自身的信息告诉你**放到哪里**，之后也告诉你**去哪里找**：哈希表在每次操作中都利用数据本身的线索来决定位置。

它的结构由大量称为**桶**（`[0] … [m-1]`）的小集合组成，它们共同构成哈希表；此外还有一条**规则，即哈希函数**，把每个元素映射到它所在的桶（衬衫 → 哈希函数 → 3，即衬衫抽屉；毛衣 0、夹克 1、裤子 2、衬衫 3、袜子 4）。要找某个东西，只需查看它所在的桶。

## 2. 哈希函数：哈希码 + 压缩

- **哈希函数**：生成哈希表的索引。目标：**均匀哈希**，即键被均匀分散，从而尽量减少冲突。
- **第一步，哈希码**：把输入的键转换为整数，并把数据尽量均匀地分散开。
- **第二步，压缩（取模）**：把哈希码映射为合法的桶索引，即 `hash_code % num_buckets`。

第一次尝试：把字符串的长度当作它的哈希值。问题在于 "banana" 的长度为 6，而只有 5 个桶的表只有索引 0–4，因此这个值必须被压缩到桶的范围之内。于是分成两部分：

1. `hashCode()` 把输入映射为一个整数（**哈希码**）；
2. **压缩**把哈希码映射到桶的范围内：**`hash = hashCode(input) % numBuckets`**。

插入和查找使用同一个函数。取 5 个桶，并以 `len` 作为哈希码：

| 输入 | hashCode = len | % 5 | 桶 |
|---|---|---|---|
| "banana" | 6 | 6 % 5 | 1 |
| "cherry" | 6 | 6 % 5 | 1 |

好的哈希函数应当是**确定性的**（相等的键总是得到相同的哈希值）、**快速的**，并且把键**均匀分布**到 0 … m−1 上。`len` 在最后一条性质上表现极差：长度相同的字符串全部冲突。对于整数键，常用的选择是**取模哈希** `k % m`，其中 **m 为素数**，这样键中的规律就不会与 m 对齐。

> 📘 **延伸阅读**：algs4 §3.4 深入讨论了哈希码，Thornton 的笔记则用一个信用卡号的例子说明，有偏的数字如何破坏哈希函数。

> ⚠️ **易错点**：在 C++ 中，**负数**的 `%` 结果仍是负数，因此对有符号整数计算的 `hashCode(key) % m` 可能得到 −2 这样的索引。应使用无符号哈希（`std::hash` 返回 `size_t`），或在用作索引之前先修正符号。

## 3. 冲突

当多个元素哈希到同一个桶时，就发生了**冲突**："banana" 与 "cherry" 都落入桶 1（就像找到自己的座位时，发现座位已被别人占了）。一般情况下冲突无法避免：可能的键远多于桶的数量，即使在均匀哈希假设下也会发生冲突。因此哈希表需要冲突解决策略。基本问题是：如何让一个桶容纳多个元素，以及哪种结构能使插入很快：为每个桶配一个链表。共有三种方法：

| 方法 | 思路 | 技术 |
|---|---|---|
| 1 | 允许每个桶内存放多个元素 | **拉链法** |
| 2 | 溢出到其他桶 | **线性探测**（以及二次探测） |
| 3 | 把已有的数据踢出去 | **布谷鸟哈希**（本章不涉及） |

第 4–6 节分别介绍拉链法、线性探测和二次探测。

## 4. 拉链法（Separate Chaining）

### 4.1 结构与跟踪

结构是一个**链表数组**（或数组列表的数组）。哈希值直接索引到正确的桶，每个数组元素（即桶）保存一个链表的**头指针**。设共有 b 个桶：

1. **哈希**：把键映射为 0 到 b − 1 之间的整数 i。
2. **插入**：若第 i 条链中**还不存在**该项，则把它加入。这需要先扫描该链以检查是否重复（若键已存在，则更新其值）。
3. **查找**：只在第 i 条链中查找。

下面是 b = 5 个桶的跟踪过程，其中"值"为插入序号，新节点加在所在链的**头部**：

| 键 | S | E | A | R | C | H | E | X | A | M | P | L | E |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 哈希 | 2 | 0 | 0 | 4 | 4 | 4 | 0 | 2 | 0 | 4 | 3 | 3 | 0 |
| 值 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

第二个 E（值 6）、第二个 A（值 8）和第三个 E（值 12）是**更新**，而不是新节点。最终的表为：0: A,8 → E,12 · 1: 空 · 2: X,7 → S,0 · 3: L,11 → P,10 · 4: M,9 → H,5 → C,4 → R,3。你可以逐步查看，也可以输入自己的键，或切换到探测（演示区域获得焦点时，← / → 键可用）：

```viz hash-table
{"title": "拉链法，m = 5", "m": 5, "hashes": "S:2, E:0, A:0, R:4, C:4, H:4, X:2, M:4, P:3, L:3", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(E); put(X); put(A); put(M); put(P); put(L); put(E)", "interactive": true}
```

### 4.2 实现

表是一个由 `m` 个头指针组成的数组 `dict`；哈希函数即哈希码经 `% m` 压缩。本章所有代码都用 `size_t` 表示大小和索引，`n` 表示存储的键值对个数，`m` 表示桶或槽的个数：

```cpp
template <typename Key, typename Value>
class SeparateChaining {
private:
  struct Node {
    Key key;
    Value val;
    Node* next;
  };
  size_t m;                // number of buckets
  size_t n = 0;            // number of key-value pairs
  Node** dict;             // dict[i] = head of chain i

  size_t hashFunction(const Key& key) const {
    return std::hash<Key>{}(key) % m;  // hash code, then compression
  }
public:
  explicit SeparateChaining(size_t buckets = 7)
      : m(buckets), dict(new Node*[buckets]()) {}  // () zero-initializes: all nullptr
  // ...
```

`get` 与 `put` 各自只对键做一次哈希，并且只遍历第 i 条链：

```cpp
  Value get(const Key& key) const {
    size_t i = hashFunction(key);                       // compute hash value
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) return x->val;                 // return when found
    }
    return Value();
  }

  void put(const Key& key, const Value& val) {
    size_t i = hashFunction(key);
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) { x->val = val; return; }      // already there: update
    }
    dict[i] = new Node{key, val, dict[i]};              // insert at head
    n++;
  }
```

`put` 先扫描链（若找到则更新），然后把新节点链接到头部：它的 `next` 指向旧的头 `dict[i]`，随后 `dict[i]` 指向它。扫描之后，这一步是 O(1)。

> ⚠️ **易错点**：有两个容易犯的错误。其一，忘记初始化头指针数组：写成 `new Node*[m]`（没有 `()`）会留下垃圾指针而不是 `nullptr`，于是任何链的第一次扫描都会崩溃。其二，`Node` 是没有构造函数的聚合类型，因此必须用花括号创建，即 `new Node{key, val, dict[i]}`；`new Node(key, val, dict[i])` 在 C++17 中无法编译。

使用拉链法删除很简单：在第 i 条链中找到节点，并像链表一样把它摘下；其他部分都不会移动。通过指向*链接*的指针（`Node**`）来遍历，可以避免对头节点做特殊处理：

```cpp
  void remove(const Key& key) {
    size_t i = hashFunction(key);
    Node** p = &dict[i];                                // the link that may need fixing
    while (*p != nullptr && (*p)->key != key) p = &(*p)->next;
    if (*p != nullptr) {
      Node* x = *p;
      *p = x->next;                                     // unlink
      delete x;
      n--;
    }
  }
```

由于表拥有堆上分配的节点，析构函数必须删除每一条链以及数组，并且禁止拷贝（见 [第 7 节](#7-完整实现)）。

### 4.3 分析：负载因子

**最坏情况 O(n)**：所有键都哈希到同一个桶，查找时就要遍历那一条链。**平均情况取决于哈希函数的强度**。若哈希函数足够强，能把 n 个元素均匀分布到 m 个桶中：

- 平均每个桶中有 **n / m** 个元素；
- 查找和插入的平均代价为 **n / m**：与对单个列表做顺序查找相比，每次查找检查的键大约少了 m 倍。

**n / m 就是负载因子**：它告诉我们哈希表有多满。要使查找和插入达到 **O(1)**，应选择与 n 成正比的 m，使 n / m 保持为常数（随着 n 增长而调整数组大小）。这样，平均查找和插入时间就是常数。

- 负载因子过高（m 过小）→ 链很长，操作变慢；
- 负载因子过低（m 过大）→ 内存浪费，大量空链。

扩容就是**重新哈希**：每个键所在的桶都取决于 m（`hash % m`），因此每个节点都必须根据新 m 下的哈希值重新链接到新数组中。这一次操作的代价为 O(n)；由于表的大小按几何级数增长，这一代价平摊到每次插入上为均摊 O(1)：

```cpp
  void rehash(size_t newM) {
    Node** old = dict;
    size_t oldM = m;
    dict = new Node*[newM]();
    m = newM;
    for (size_t i = 0; i < oldM; i++) {
      Node* x = old[i];
      while (x != nullptr) {
        Node* next = x->next;
        size_t j = hashFunction(x->key);                // new hash value
        x->next = dict[j];
        dict[j] = x;
        x = next;
      }
    }
    delete[] old;
  }
```

**有序操作**（最小值、最大值、按序输出所有键、区间查询）**不被支持**；这些操作请使用（平衡的）BST（见 [搜索树](topic-search-trees.zh-CN.md)）。插入、查找和删除的平均情况为 O(1)，最坏情况为 O(n)。

> 📘 **延伸阅读**：负载因子在两类方法中的含义不同。在拉链法中，α = n/m 是平均链长，可以大于 1（每个桶 10 个键仍然可用，只是更慢）。在线性探测或二次探测中，每个键都需要自己的槽位，因此 α 是数组中被占用的比例，**必须保持在 1 以下**。（algs4 §3.4）

### 4.4 练习

#### 拉链法，m = 7

对整数键使用拉链法，桶数 **m = 7**，哈希函数为 **h(k) = k % m**。新节点加在链的头部。

- **任务 A**：按顺序插入键值对 (47, 0)、(3, 1)、(28, 2)、(14, 3)、(9, 4)、(47, 5)，并给出得到的表。
- **任务 B**：查找键 28 和键 47 各需要多少次比较？
- **任务 C**：删除键 14，并给出该表。

> 提示：47 出现了两次。

<details>
<summary>解答</summary>

哈希值：47 % 7 = 5，3 % 7 = 3，28 % 7 = 0，14 % 7 = 0，9 % 7 = 2。

**任务 A 之后**：第二个 (47, 5) 在链 5 中找到 47，并**更新**其值；14 放在 28 前面：

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

**任务 C 之后**：链 0 变为 (28, 2)，其他部分不变。可以这样验证：

```viz hash-table
{"title": "拉链法检查", "m": 7, "ops": "put(47, 0); put(3, 1); put(28, 2); put(14, 3); put(9, 4); put(47, 5); get(28); get(47); remove(14)"}
```

[第 7 节](#7-完整实现)中编译后的程序会打印相同的表。

</details>

## 5. 线性探测（Linear Probing）

### 5.1 插入与查找

**线性探测**把所有键都保存在数组本身中：当某个桶被占用时，就**溢出到下一个位置**（这一类方法称为*开放寻址*）。每个槽最多保存一个键，键的探测序列为 h, h+1, h+2, …（模 m）：

- **插入**：要插入 x，计算 h(x) 并尝试把 x 放在那里。若该位置已满，则逐个位置在数组中移动，**绕过末尾回到开头**，直到找到空位。
- **查找**：计算 h(x) 并从那里开始查找。沿环移动，**直到找到该元素或检测到空位**。空位证明 x 不在表中，因为插入 x 时它本应被放在那里。
- 使用负载因子 n/m 防止表被填满到容量上限。

设想这张表是一个由 m = 16 个槽组成的环，槽中依次存放 z（2）、x（7）、w（8）、r（9）和 y（14），其中 w 的本位槽为 7，r 的本位槽为 8（它们各自被顺移了一格）。**查找 h(a) = 8 的 a**：槽 8（w）、9（r），10 为空 → a 不在表中。**插入 h(b) = 7 的 b**：槽 7、8、9 都已占用，因此 b 放入槽 10：

```viz hash-table
{"title": "环形 16 槽上的线性探测", "mode": "linear", "m": 16, "hashes": "z:2, x:7, w:7, r:8, y:14, b:7, a:8", "ops": "put(z); put(x); put(w); put(r); put(y); get(a); put(b); remove(w); get(r)", "interactive": true}
```

在代码中，`find` 沿探测序列前进，并统计检查过的槽数；`put` 记住第一个可复用的槽（空槽或墓碑，见下一节），但会继续扫描，直到遇到空槽，这样位于更远处的已有键会被更新而不是重复插入：

```cpp
template <typename Key, typename Value, bool Quadratic = false>
class OpenAddressing {
private:
  enum class State { Empty, Full, Deleted };
  struct Slot {
    Key key{};
    Value val{};
    State state = State::Empty;
  };
  size_t m;                // number of slots
  size_t n = 0;            // number of full slots
  Slot* table;

  size_t home(const Key& key) const { return std::hash<Key>{}(key) % m; }
  size_t probe(size_t h, size_t i) const {
    return Quadratic ? (h + i * i) % m : (h + i) % m;   // i-th slot of the probe sequence
  }
public:
  static constexpr size_t npos = static_cast<size_t>(-1);

  // Slot holding key, or npos. probes counts the slots examined.
  size_t find(const Key& key, size_t& probes) const {
    size_t h = home(key);
    probes = 0;
    for (size_t i = 0; i < m; i++) {
      size_t s = probe(h, i);
      probes++;
      if (table[s].state == State::Empty) return npos;           // blank spot: stop
      if (table[s].state == State::Full && table[s].key == key) return s;
      // a tombstone or another key: keep going
    }
    return npos;
  }

  // Returns false only if no free slot was reachable.
  bool put(const Key& key, const Value& val) {
    size_t h = home(key), firstFree = npos;
    for (size_t i = 0; i < m; i++) {
      size_t s = probe(h, i);
      if (table[s].state == State::Full && table[s].key == key) {
        table[s].val = val;                                      // update
        return true;
      }
      if (table[s].state != State::Full && firstFree == npos)
        firstFree = s;                                           // empty or tombstone
      if (table[s].state == State::Empty) break;                 // key cannot be further on
    }
    if (firstFree == npos) return false;
    table[firstFree] = Slot{key, val, State::Full};
    n++;
    return true;
  }
  // ...
```

同一个模板覆盖两种探测方式：`Quadratic = false` 时探测为 `(h + i) % m`；第 6 节会切换这个标志。

### 5.2 删除：墓碑

删除比拉链法更棘手。若只是查找到元素并清空其槽位，就会出问题：**先删除 w，再查找 r**。r 被放在槽 9，是因为槽 8 当时已被 w 占用；如果现在槽 8 变为空，那么从 8 开始查找 r 就会在这里停下，并错误地报告 r 不存在。

解决办法是**墓碑**，它用来区分*已删除*与*空*：

- 删除元素时，把该单元标记为**空但曾被占用**（墓碑）。
- 查找时**不要在墓碑处停止**，继续向下查找。
- 插入时可以**替换墓碑**（复用该槽）。

在上面的演示中，最后两个操作先删除 w（槽 8 变为 †），然后通过越过墓碑来查找 r。在代码中，删除只会改变槽位的状态：

```cpp
  void remove(const Key& key) {
    size_t probes;
    size_t s = find(key, probes);
    if (s != npos) {
      table[s].state = State::Deleted;                           // tombstone, not Empty
      n--;
    }
  }
```

> ⚠️ **易错点**：墓碑对*查找*而言不是空的，但对*插入*而言是可用的。若在墓碑处停止查找，就会丢失键；若从不复用墓碑，表就会被墓碑填满（重新哈希到新数组会清除它们）。

### 5.3 实际表现：速度与主聚集

线性探测是**最快的通用哈希策略之一**：

- **内存开销低**：只需要一个数组和一个哈希函数（没有节点，没有 `next` 指针）；
- **局部性极好**：查找访问的是相邻的位置；
- **缓存性能出色**：上述两点的结合。

它的弱点是**主聚集**。**聚集**是一段连续被占用的槽位。新键很可能哈希到**大聚集的中部**（大聚集就是大靶子），而每个这样的键都被放在聚集的末端，使聚集变得更大，因此冲突的数量会随着已有的冲突而增长。

### 5.4 时间分析与扩容

在均匀哈希假设下，设负载因子为 **α = n/m**（n 为键的数量，m 为表的大小），平均探测次数为（Knuth 1963）：

- 查找命中：½ (1 + 1 / (1 − α))
- 查找未命中与插入：½ (1 + 1 / (1 − α)²)

这些公式仅在 α < 1 时有意义。在 α = ½ 以及接近 1 时：

| α | 查找命中 | 查找未命中 / 插入 |
|---|---|---|
| 1/2 | 1.5 次探测 | 2.5 次探测 |
| 0.9 | 5.5 次探测 | 50.5 次探测 |

表接近满时，未命中的探测次数急剧增长。**典型选择是 n/m = ½**，这样每次操作的平均工作量为常数。通过在 n/m ≥ ½ 时**加倍**表的大小、在 n/m ≤ ⅛ 时**减半**，把它维持在这一水平。

改变哈希表大小的代价是多少？每个键的槽位都取决于 m（`hash % m`），因此扩容必须把**每个键都重新哈希**到新数组中，这一次操作为 O(n)。由于大小每次加倍或减半（与 ArrayList 相同），这一代价被分摊到导致它的那些操作上：每次操作**均摊 O(1)**。

```cpp
  void rehash(size_t newM) {
    Slot* old = table;
    size_t oldM = m;
    table = new Slot[newM];
    m = newM;
    n = 0;
    for (size_t s = 0; s < oldM; s++)
      if (old[s].state == State::Full) put(old[s].key, old[s].val);
    delete[] old;
  }
```

> 📘 **延伸阅读**：你不能把旧数组逐个槽位地复制到更大的数组中：键仍停留在它们旧的 `% m` 位置上，而用新的 m 进行的查找会漏掉它们。重新哈希还会丢弃所有墓碑。（Thornton, Hash Tables）Thornton 的笔记还会**向后**探测（i − 1、i − 2、……）；只要插入、查找和删除使用相同的探测序列，哪个方向都可以，而 algs4 与本章相同，向前移动，即 (h + i) % m。

### 5.5 练习

#### 带删除的线性探测

一张表有 m = 13 个槽（索引 0–12），h(x) = x mod 13，使用带墓碑的线性探测。依次插入键 18、3、16、22、21、8；然后删除 16 和 21；然后查找 8；然后插入 20 和 7。请分别给出插入之后、删除之后以及最终的表。

> 提示：删除会留下墓碑，而查找 8 必须越过其中一个墓碑。

<details>
<summary>解答</summary>

插入：18 → 5；3 → 3；16 → 3 已占用 → **4**；22 → 9；21 → 8；8 → 8 已占用，9 已占用 → **10**。

| 槽 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 插入后 | | | | 3 | 16 | 18 | | | 21 | 22 | 8 | | |
| 删除后 | | | | 3 | † | 18 | | | † | 22 | 8 | | |
| 最终 | | | | 3 | † | 18 | | 20 | 7 | 22 | 8 | | |

删除 16 和 21 → 在槽 4 和槽 8 留下墓碑（†）。**查找 8**：槽 8 是墓碑（继续查找），9 中是 22，10 中是 8 → **3 次探测后找到**。若没有墓碑，查找会在空槽 8 处停止，并错误地判定未找到。

插入 20 → 槽 7（空）。插入 7 → 槽 7 中是 20；槽 8 是墓碑，因此 **7 复用槽 8**。（稳妥的做法是在使用墓碑之前，先检查 7 是否已存在于更后面的位置（9、10，然后是空的 11）；结果相同。）

```viz hash-table
{"title": "线性探测检查", "mode": "linear", "m": 13, "ops": "put(18); put(3); put(16); put(22); put(21); put(8); remove(16); remove(21); get(8); put(20); put(7)"}
```

[第 7 节](#7-完整实现)中编译后的程序会重现这些表（`X` 标记墓碑）。

</details>

## 6. 二次探测（Quadratic Probing）

### 6.1 探测序列

修改探测序列，使得

**h(k, i) = (h(k) + c₁·i + c₂·i²) % m，其中 c₂ ≠ 0**，i 是该键迄今为止发生的冲突次数（i = 0 为第一次尝试）。

当 c₂ = 0 时，二次探测退化为线性探测。跳跃的步长逐渐增大（在 c₁ = 0、c₂ = 1 时，相对于本位槽的偏移依次为 1、4、9、……），因此发生冲突的键不会全部堆到同一段连续的聚集上。查找和删除使用**相同的探测序列**和**墓碑**，与线性探测完全一样。在第 5 节的代码中，只有 `probe` 函数会改变，类通过其 `Quadratic` 模板参数来选择它（c₁ = 0，c₂ = 1）：

```cpp
  size_t probe(size_t h, size_t i) const {
    return Quadratic ? (h + i * i) % m : (h + i) % m;
  }
```

> ⚠️ **易错点**：探测序列不一定会访问每一个槽位。当 h(k, i) = (h(k) + i²) % 13 时，偏移量 i² % 13 只取 7 个不同的值（0, 1, 3, 4, 9, 10, 12），因此即使表中仍有空槽，插入也可能失败。在编译后的程序中，13 个都哈希到槽 0 的键只能填满 13 个槽中的 7 个。这是保持低负载因子的又一个理由。

### 6.2 练习

#### 带删除的二次探测

使用 h(k) = k % m，探测序列为 h(k, i) = (h(k) + i²) % m，其中 m = 13，并使用墓碑。依次插入键值对 (17,0)、(33,1)、(18,2)、(20,3)、(44,4)、(11,5)、(19,6)、(7,7)（17 落在槽 4）；这里 i 是该键迄今为止发生的冲突次数。然后删除 44，查找 19，并插入 5。

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

本章的两个类模板涵盖全部内容：`SeparateChaining`（m 个桶、节点链、`rehash`、析构函数），以及 `OpenAddressing`，这是一个模板，由其 `Quadratic` 标志选择线性探测或二次探测（墓碑作为 `Deleted` 状态，`rehash` 会清除它们）。`main` 重演三道练习题；表的大小由构造函数设定（7 和 13）。`X` 标记墓碑，`.` 标记空槽。

```cpp
#include <cstddef>
#include <functional>
#include <iostream>
#include <string>

// ---------------------------------------------------------------------------
// Separate chaining: an array of m singly linked lists.
// ---------------------------------------------------------------------------
template <typename Key, typename Value>
class SeparateChaining {
private:
  struct Node {
    Key key;
    Value val;
    Node* next;
  };
  size_t m;                // number of buckets
  size_t n = 0;            // number of key-value pairs
  Node** dict;             // dict[i] = head of chain i

  size_t hashFunction(const Key& key) const {
    return std::hash<Key>{}(key) % m;  // hash code, then compression
  }

public:
  explicit SeparateChaining(size_t buckets = 7)
      : m(buckets), dict(new Node*[buckets]()) {}  // () zero-initializes: all nullptr
  SeparateChaining(const SeparateChaining&) = delete;
  SeparateChaining& operator=(const SeparateChaining&) = delete;
  ~SeparateChaining() {
    for (size_t i = 0; i < m; i++) {
      while (dict[i] != nullptr) {
        Node* x = dict[i];
        dict[i] = x->next;
        delete x;
      }
    }
    delete[] dict;
  }

  size_t size() const { return n; }
  double loadFactor() const { return static_cast<double>(n) / m; }

  Value get(const Key& key) const {
    size_t i = hashFunction(key);                       // compute hash value
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) return x->val;                 // return when found
    }
    return Value();
  }

  void put(const Key& key, const Value& val) {
    size_t i = hashFunction(key);
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) { x->val = val; return; }      // already there: update
    }
    dict[i] = new Node{key, val, dict[i]};              // insert at head
    n++;
  }

  void remove(const Key& key) {
    size_t i = hashFunction(key);
    Node** p = &dict[i];                                // the link that may need fixing
    while (*p != nullptr && (*p)->key != key) p = &(*p)->next;
    if (*p != nullptr) {
      Node* x = *p;
      *p = x->next;                                     // unlink
      delete x;
      n--;
    }
  }

  // Rehash every node into a new array of newM buckets.
  void rehash(size_t newM) {
    Node** old = dict;
    size_t oldM = m;
    dict = new Node*[newM]();
    m = newM;
    for (size_t i = 0; i < oldM; i++) {
      Node* x = old[i];
      while (x != nullptr) {
        Node* next = x->next;
        size_t j = hashFunction(x->key);                // new hash value
        x->next = dict[j];
        dict[j] = x;
        x = next;
      }
    }
    delete[] old;
  }

  void print() const {
    for (size_t i = 0; i < m; i++) {
      std::cout << i << ':';
      for (Node* x = dict[i]; x != nullptr; x = x->next)
        std::cout << " (" << x->key << ',' << x->val << ')';
      std::cout << '\n';
    }
  }
};

// ---------------------------------------------------------------------------
// Open addressing: one array of slots. Quadratic = false -> linear probing,
// Quadratic = true -> h(k, i) = (h(k) + i*i) % m.
// ---------------------------------------------------------------------------
template <typename Key, typename Value, bool Quadratic = false>
class OpenAddressing {
private:
  enum class State { Empty, Full, Deleted };
  struct Slot {
    Key key{};
    Value val{};
    State state = State::Empty;
  };
  size_t m;                // number of slots
  size_t n = 0;            // number of full slots
  Slot* table;

  size_t home(const Key& key) const { return std::hash<Key>{}(key) % m; }
  size_t probe(size_t h, size_t i) const {
    return Quadratic ? (h + i * i) % m : (h + i) % m;
  }

public:
  static constexpr size_t npos = static_cast<size_t>(-1);

  explicit OpenAddressing(size_t slots = 13) : m(slots), table(new Slot[slots]) {}
  OpenAddressing(const OpenAddressing&) = delete;
  OpenAddressing& operator=(const OpenAddressing&) = delete;
  ~OpenAddressing() { delete[] table; }

  size_t size() const { return n; }
  double loadFactor() const { return static_cast<double>(n) / m; }

  // Slot holding key, or npos. probes counts the slots examined.
  size_t find(const Key& key, size_t& probes) const {
    size_t h = home(key);
    probes = 0;
    for (size_t i = 0; i < m; i++) {
      size_t s = probe(h, i);
      probes++;
      if (table[s].state == State::Empty) return npos;           // blank spot: stop
      if (table[s].state == State::Full && table[s].key == key) return s;
      // a tombstone or another key: keep going
    }
    return npos;
  }

  Value get(const Key& key) const {
    size_t probes;
    size_t s = find(key, probes);
    return s == npos ? Value() : table[s].val;
  }

  // Returns false only if no free slot was reachable.
  bool put(const Key& key, const Value& val) {
    size_t h = home(key), firstFree = npos;
    for (size_t i = 0; i < m; i++) {
      size_t s = probe(h, i);
      if (table[s].state == State::Full && table[s].key == key) {
        table[s].val = val;                                      // update
        return true;
      }
      if (table[s].state != State::Full && firstFree == npos)
        firstFree = s;                                           // empty or tombstone
      if (table[s].state == State::Empty) break;                 // key cannot be further on
    }
    if (firstFree == npos) return false;
    table[firstFree] = Slot{key, val, State::Full};
    n++;
    return true;
  }

  void remove(const Key& key) {
    size_t probes;
    size_t s = find(key, probes);
    if (s != npos) {
      table[s].state = State::Deleted;                           // tombstone, not Empty
      n--;
    }
  }

  // Rehash every key into a new array; this also discards all tombstones.
  void rehash(size_t newM) {
    Slot* old = table;
    size_t oldM = m;
    table = new Slot[newM];
    m = newM;
    n = 0;
    for (size_t s = 0; s < oldM; s++)
      if (old[s].state == State::Full) put(old[s].key, old[s].val);
    delete[] old;
  }

  void print() const {
    for (size_t s = 0; s < m; s++) {
      if (table[s].state == State::Full) std::cout << table[s].key;
      else std::cout << (table[s].state == State::Deleted ? "X" : ".");
      std::cout << ' ';
    }
    std::cout << '\n';
  }
};

int main() {
  // Separate chaining, m = 7
  SeparateChaining<int, int> chain(7);
  int pairs[][2] = {{47, 0}, {3, 1}, {28, 2}, {14, 3}, {9, 4}, {47, 5}};
  for (auto& p : pairs) chain.put(p[0], p[1]);
  chain.print();
  std::cout << "get(28) = " << chain.get(28) << ", get(47) = " << chain.get(47)
            << ", n = " << chain.size() << ", load factor = " << chain.loadFactor() << '\n';
  chain.remove(14);
  std::cout << "after remove(14):\n";
  chain.print();
  chain.rehash(14);
  std::cout << "after rehash(14):\n";
  chain.print();

  // Linear probing, m = 13
  std::cout << "\nlinear probing\n";
  OpenAddressing<int, int> lp(13);
  for (int k : {18, 3, 16, 22, 21, 8}) lp.put(k, 0);
  lp.print();
  lp.remove(16);
  lp.remove(21);
  lp.print();
  size_t probes;
  size_t s = lp.find(8, probes);
  std::cout << "find(8): slot " << s << ", " << probes << " probes\n";
  lp.put(20, 0);
  lp.put(7, 0);
  lp.print();
  lp.rehash(26);
  std::cout << "after rehash(26), tombstones gone:\n";
  lp.print();

  // Quadratic probing, m = 13
  std::cout << "\nquadratic probing\n";
  OpenAddressing<int, int, true> qp(13);
  int qpairs[][2] = {{17, 0}, {33, 1}, {18, 2}, {20, 3}, {44, 4}, {11, 5}, {19, 6}, {7, 7}};
  for (auto& p : qpairs) qp.put(p[0], p[1]);
  qp.print();
  qp.remove(44);
  s = qp.find(19, probes);
  std::cout << "find(19): slot " << s << ", value " << qp.get(19) << ", " << probes << " probes\n";
  qp.put(5, 8);
  qp.print();

  // Quadratic probing may never reach some free slots: i*i % 13 takes only 7 values.
  OpenAddressing<int, int, true> few(13);
  int stored = 0;
  for (int k = 0; k < 13 * 13; k += 13) stored += few.put(k, 0) ? 1 : 0;   // 13 keys, all home slot 0
  std::cout << "\n13 keys that all hash to slot 0: " << stored << " stored, "
            << 13 - stored << " rejected\n";
}
```

输出：

```text
0: (14,3) (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
get(28) = 2, get(47) = 5, n = 5, load factor = 0.714286
after remove(14):
0: (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
after rehash(14):
0: (28,2)
1:
2:
3: (3,1)
4:
5: (47,5)
6:
7:
8:
9: (9,4)
10:
11:
12:
13:

linear probing
. . . 3 16 18 . . 21 22 8 . . 
. . . 3 X 18 . . X 22 8 . . 
find(8): slot 10, 3 probes
. . . 3 X 18 . 20 7 22 8 . . 
after rehash(26), tombstones gone:
. . . 3 . . . 7 8 . . . . . . . . . 18 . 20 . 22 . . . 

quadratic probing
. . . 7 17 18 44 33 20 . 19 11 . 
find(19): slot 10, value 6, 3 probes
. . . 7 17 18 5 33 20 . 19 11 . 

13 keys that all hash to slot 0: 7 stored, 6 rejected
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

**必记的五个要点**

1. 拉链法：`i = hash(key) % m`，扫描链 i（若键已存在则更新），否则在头部插入新节点；查找只在链 i 中进行。
2. 平均代价与负载因子 n/m 成正比；通过随 n 增长而增大 m 来保持其为常数（探测时在 ½ 处加倍、在 ⅛ 处减半）；扩容意味着对每个键重新哈希：一次性 O(n)，均摊 O(1)。
3. 线性探测的查找只在该键或空槽处停止，因此删除必须留下墓碑；查找会跳过墓碑，插入可以复用它们。
4. 线性探测在实践中很快（内存、局部性、缓存），但存在主聚集的问题；命中的探测次数约为 ½(1 + 1/(1−α))，未命中约为 ½(1 + 1/(1−α)²)，因此应保持 α ≈ ½。
5. 二次探测使用 (h(k) + c₁i + c₂i²) % m，其中 c₂ ≠ 0（c₂ = 0 即线性探测）；哈希表平均为 O(1)，但最坏为 O(n)，且不支持有序操作。
