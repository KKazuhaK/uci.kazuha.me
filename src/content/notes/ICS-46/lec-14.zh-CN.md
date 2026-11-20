---
title: "2-3 树与红黑 BST"
summary: "平衡查找树：2-3 树的查找、以临时 4-节点分裂实现的插入与高度上界；左倾红黑 BST（一一对应、定义、旋转、颜色翻转、插入及其检查顺序、2 lg n 的高度）；然后是哈希表：桶、哈希码与压缩、冲突。"
---

# Information and Computer Science 46 — Lecture 14：平衡 BST（2-3 树、LLRB）+ 哈希表

## 目录

- [1. 目标：最坏情况下的 log n](#1-目标最坏情况下的-log-n)
- [2. 2-3 树](#2-2-3-树)
- [3. 2-3 树查找](#3-2-3-树查找)
- [4. 2-3 树插入](#4-2-3-树插入)
- [5. 2-3 树的性能](#5-2-3-树的性能)
- [6. 左倾红黑树：用 BST 表示 2-3 树](#6-左倾红黑树用-bst-表示-2-3-树)
- [7. LLRB 的定义](#7-llrb-的定义)
- [8. 查找与 Node 类](#8-查找与-node-类)
- [9. 旋转与颜色翻转](#9-旋转与颜色翻转)
- [10. LLRB 插入](#10-llrb-插入)
- [11. LLRB 的时间分析与字典小结](#11-llrb-的时间分析与字典小结)
- [12. 哈希表：基本思想](#12-哈希表基本思想)
- [13. 哈希函数：哈希码 + 压缩](#13-哈希函数哈希码--压缩)
- [14. 冲突](#14-冲突)
- [15. 完整实现](#15-完整实现)
- [16. 课堂活动（附解答）](#16-课堂活动附解答)
- [17. 速查与必记的 5 个要点](#17-速查与必记的-5-个要点)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026，11/10/26 与 11/17/26（两份课件的标题都是 "Lecture 14"）
> 整理自 11/10 课件《Balanced BST + Review》（2-3 树）与 11/17 课件《LLRB + Hash Tables》，补充材料为 algs4 §3.3 Balanced Search Trees、algs4 §3.4 Hash Tables 以及 Thornton 的 ICS 46 笔记（Hash Tables；AVL Trees 中的旋转）。11/17 课件中的拉链法幻灯片会在 Lecture 15 中重复出现，因此在那里讲解。按概念组织，而不是按资料来源组织。

> 📅 **课程安排**：(11/10) 期中考试周四 11/12 · Quiz 4：Sorting、Trees、Heaps · 期中考试之后才发布新的 HW/Lab
> (11/17) Quiz 5 周五 11/20（BST 与平衡 BST）· HW 6 与 Lab 5 周五 11/20 截止 · 期中考试仍在批改
> 课程认可的 AI 工具：需提交两部分同意书（用于工具访问的数据存储，不用于学术诚信案件；可选择为 1% 额外学分提供研究用途，并附有替代的额外学分方式）
> 11/10 课件以两道期中复习题结束（循环单链表的 `removeLast`，以及用一个队列实现栈），它们在 [期中复习笔记](midterm-review.zh-CN.md) 中有完整解答。

---

## 1. 目标：最坏情况下的 log n

普通 BST 只有在恰好平衡时才快。第 5 张幻灯片（11/10）用一张表说明了这个问题：

| | 查找（最坏） | 插入（最坏） | 删除（最坏） | 查找（平均） | 插入（平均） | 删除（平均） |
|---|---|---|---|---|---|---|
| BST | n | n | n | log n | log n | √n |
| **目标** | **log n** | **log n** | **log n** | **log n** | **log n** | **log n** |

最坏情况是由有序输入（A C E H R S X）造成的"一条棍子"；随机输入得到 log n，但 Hibbard 删除会把删除的平均代价拖到 √n。**平衡查找树**保证每种操作都是 log n。红黑树被用作系统的符号表（例如 C++ 的 `std::map`）；AVL、伸展树和随机化 BST 也是其他的平衡 BST。Yeh 讲的是**左倾红黑树（LLRB）**，要理解它，我们先从 2-3 树开始。

## 2. 2-3 树

2-3 树的一个节点可以存放**一个或两个键**：

- **2-节点**：1 个键（及其值），**2 条链接**——左子树更小，右子树更大（就是普通的 BST 节点）。
- **3-节点**：2 个键（及其值），**3 条链接**——左（< key1）、中（介于 key1 与 key2 之间）、右（> key2）。

以下两条性质始终成立：

- **对称序**：中序遍历按升序给出所有键。
- **完美平衡**：从根到每个空链接的路径长度完全相同。

整节课都使用的"结构树"（根为 M；其下是 E、J 和 R；底层是 A C、H、L、P、S X）：

```viz two-three-tree
{"title": "2-3 查找树的结构（幻灯片 8、11）：查找 H", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "get(H)"}
```

（演示会按合适的顺序插入这些键来构造该树；同一节点中的键用粗条连接。）

## 3. 2-3 树查找

把查找键与节点中的**每一个键**比较，找到它所在的区间（左、若是 3-节点则为中间、或右），沿该链接前进，然后重复（幻灯片 9–12）。幻灯片 9–10 查找 **H**：H < M → 走左边；H 位于 E 与 J 之间 → 走中间；找到 H → 返回其值（查找命中）。若未命中，则在空链接处结束。

## 4. 2-3 树插入

先查找该键；查找会结束于最底层的某个节点。然后（幻灯片 14–18）：

1. **插入到 2-节点**：加入该键，使其变为 3-节点。完成。（幻灯片 14：插入 K → 2-节点 L 变为 K L。）
2. **插入到 3-节点**：加入该键，形成**临时 4-节点**（3 个键、4 条链接），然后把它分裂成两个 2-节点，并把**中间键上推到父节点**：
   - 树只是一个 3-节点（幻灯片 15，在 A E 中插入 S → A E S）：中间键 E 成为新的根，其子节点为 A 与 S。**高度增加 1**。
   - 父节点是 2-节点（幻灯片 16，在 S X 中插入 Z → S X Z）：X 上推，父节点 R 变为 3-节点 R X。完成。
   - 父节点是 3-节点（幻灯片 17，在 A C 中插入 D → A C D）：C 上推，父节点 E J 变为临时 4-节点 C E J；再次分裂，E 上推到 M。**必要时沿树向上重复。**
3. **分裂根**（幻灯片 18）：如果根最终成为临时 4-节点，则把它分裂成**三个 2-节点**。高度增加 1，但完美平衡得以保持——2-3 树从**顶部**长高，而不是从底部。

在结构树上逐步演示幻灯片中的例子（演示获得焦点时，← / → 键可用）：

```viz two-three-tree
{"title": "幻灯片 14–17：插入 K、Z、D", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "insert(K); insert(Z); insert(D)", "interactive": true}
```

每次变换都是**局部的**：它只改变常数个链接，并上推一个键；树的其他部分不受影响。这就是每次插入后，顺序与平衡都能保持的原因。（幻灯片 13 链接到 algs4 的 *3.3 2-3 Tree Demo*。）

> ⚠️ **易错点**：新键绝不会作为新节点出现在底部——那样会破坏完美平衡。它总是加入一个已有的底层节点；只有根的分裂才会增加一层。

> 📝 **练习**：[活动 1（11/10）](#161-活动-1构造1110-课件幻灯片-19)——依次插入 E A S Y Q U T I O N，构造一棵 2-3 树。

## 5. 2-3 树的性能

幻灯片 20 要求求出含 n 个键的 2-3 树的高度：

- **最坏情况：lg n**——全部为 2-节点（完美二叉树）。
- **最好情况：log₃ n ≈ 0.631 lg n**——全部为 3-节点。

因此查找和插入最多访问约 lg n 个节点：保证 **O(log n)**，幻灯片 21 在表格的每一列都把 2-3 树标为 log n。对于一百万个键，层数在 12 到 20 之间。

问题在于代码：要处理两种节点类型、把 2-节点转换为 3-节点、分裂 4-节点，还有大量情况。LLRB 正是为了解决这种复杂性。

## 6. 左倾红黑树：用 BST 表示 2-3 树

**用普通 BST 表示 2-3 树**（11/17 课件的幻灯片 5–7、9）：

- 从由 2-节点组成的标准 BST 开始。
- **红链接把两个 2-节点"粘合"成一个逻辑上的 3-节点。** 3-节点 (a, b) 变为以 a 为左子节点、通过红链接相连的 b：小于 a 的键挂在 a 的左边，介于 a 与 b 之间的键挂在 a 的右边，大于 b 的键挂在 b 的右边。
- **黑链接**把 2-3 树连接在一起。
- 红链接是内部的，并且**向左倾斜**。

这是一个**一一对应**：把红链接画成水平方向，再把它们连接的节点收缩，就能得到原来的 2-3 树。由于黑链接恰好就是 2-3 树的链接，LLRB 保持**完美黑平衡**。优点是：**BST 代码几乎无需修改即可使用**。用 View 开关可以在 LLRB 视图与 2-3 视图（红链接水平展开）之间切换：

```viz llrb
{"title": "幻灯片 6–7：以 LLRB 表示的结构树", "tree": "M, J, R, *E, L, P, X, C, H, -, -, -, -, *S, -, *A"}
```

## 7. LLRB 的定义

左倾红黑树是满足以下条件（幻灯片 10）的 BST：

1. **不存在两条连续的红链接**：没有节点与两条红链接相连。
2. **左倾**：每条红链接都向左倾斜。
3. **完美黑平衡**：从根到每个空链接的路径上，黑链接的数量相同。

规则 1 意味着不存在 4-节点；规则 2 使每个 3-节点只有一种固定形状；规则 3 就是 2-3 树的完美平衡。

> 📝 **练习**：[活动 1（11/17）](#162-活动-1合法的-llrb1117-课件幻灯片-8)——哪些树是合法的 LLRB？

## 8. 查找与 Node 类

**查找与 BST 查找完全相同**——忽略颜色——但由于树是平衡的，它运行得更快（幻灯片 11）：

```cpp
Value get(const Key& key) const{
    return get(root, key);
}

Value get(Node* x, const Key& key) const {
    while (x != nullptr) {
        if      (key < x->key) x = x->left;
        else if (key > x->key) x = x->right;
        else                   return x->val;
    }
    return Value{};
}
```

这里没有链接对象，因此**每个节点存储其父链接的颜色**（幻灯片 12）：`true` = 红，`false` = 黑，空链接总是黑色。

```cpp
static const bool RED = true;
static const bool BLACK = false;
// BST helper node data type
class Node {
public:
Key key; // key
     Value val; // associated data
     Node *left, *right; // links to left and right subtrees
     bool color; // color of parent link
     int size; // subtree count
};
bool isRed(Node* x) {
     if (x == nullptr) return false; // null links are black
     return x->color == RED;
}
```

在幻灯片的图中，`h->left->color` 为 RED（E–C 是红色的），`h->right->color` 为 BLACK（E–J 是黑色的）。

> ⚠️ **易错点**：颜色是*指向某节点的链接*的属性，而不是节点"自身"的属性。"C 是红色的"意思是"从 C 的父节点到 C 的链接是红色的"。根没有父链接，因此它总是黑色的。

## 9. 旋转与颜色翻转

插入可能会暂时破坏颜色规则；三种 O(1) 操作可以修复它们（幻灯片 13–15）。幻灯片用图示来表示它们；下面的代码是 Yeh 的 C++ 风格下的标准 algs4 版本（包含 `size` 的更新，以保证计数正确）：

- **左旋**：把 h 与其右子节点 x 之间（暂时）右倾的红链接，变为左倾的红链接。x 取代 h 的位置并继承 h 的颜色；h 成为 x 的红色左子节点；x 原来的左子树（键介于 h 与 x 之间）成为 h 的右子树。
- **右旋**：镜像操作——把左倾的红链接变为（暂时）右倾。
- **颜色翻转**：一个带有两个红色子节点的节点是临时 4-节点。把两个子节点都设为黑色，并把该节点自身的链接设为红色：中间键上移到其父节点的 2-3 节点中——这就是 4-节点的分裂。

```cpp
Node* rotateLeft(Node* h) {
    Node* x = h->right;
    h->right = x->left;
    x->left = h;
    x->color = h->color;
    h->color = RED;
    x->size = h->size;
    h->size = size(h->left) + size(h->right) + 1;
    return x;
}
// rotateRight: same code with left and right swapped

void flipColors(Node* h) {
    h->color = RED;
    h->left->color = BLACK;
    h->right->color = BLACK;
}
```

> 📘 **课外补充**：旋转改变三个指针，并保持对称序——三棵子树（小于 E、介于 E 与 S 之间、大于 S）从左到右的顺序保持不变。旋转和翻转都不会改变任何从根到空链接的路径上的黑链接数量，这就是它们能保持完美黑平衡的原因。（algs4 §3.3；Thornton 的 AVL 笔记使用了相同的旋转。）

## 10. LLRB 插入

**策略**：保持与 2-3 树的一一对应。在每一步中，对称序与完美黑平衡都会维持，但颜色不变式可能被暂时破坏（幻灯片 16）：可能出现右倾的红链接、两个红色子节点（临时 4-节点）、左-左红链接，或左-右红链接（两者都是临时 4-节点）。旋转和颜色翻转会把它们恢复。

算法（幻灯片 17）：

1. 执行标准的 BST 插入，并把**新链接染成红色**（新键加入一个已有的 2-3 节点）。
2. 沿路径向上返回时，重复执行，直到颜色不变式恢复：
   - 右链接为红（左链接为黑）？→ **左旋**；
   - 连续两条左红链接？→ **右旋**；
   - 两个子节点都是红色？→ **颜色翻转**。

代码（幻灯片 19）：

```cpp
// insert the key-value pair in the subtree rooted at h
template <typename Key, typename Value>
Node<Key, Value>* put(Node<Key, Value>* h, const Key& key, const Value& val) {
    if (h == nullptr) return new Node<Key,Value>(key, val, RED, 1);  // Insert at bottom, color red

    if (key < h->key) h->left = put(h->left,  key, val);  // Compare as before to traverse tree
    else if (key > h->key) h->right = put(h->right, key, val);
    else h->val    = val;

    if (isRed(h->right) &&  !isRed(h->left))       h = rotateLeft(h); // Fix any right-leaning links
    if (isRed(h->left)  &&   isRed(h->left->left)) h = rotateRight(h);// 2 left red links
    if (isRed(h->left)  &&   isRed(h->right))      flipColors(h);     // 4-node

    h->size = size(h->left) + size(h->right) + 1;
    return h;
}
```

幻灯片中的错误：幻灯片 12 中的 `Node` 是一个没有构造函数的普通类（也没有模板参数），因此按原样写的 `new Node<Key,Value>(key, val, RED, 1)` 无法通过编译——需要为 `Node` 提供构造函数 `Node(key, val, color, size)`，并把两个链接都设为 `nullptr`，如 [§15](#15-完整实现) 所示。

**三个检查的顺序很重要**（幻灯片 19–20）：每一步修复都恰好产生下一个检查所寻找的情形——一次左旋可能产生连续两条左红链接，右旋随后把它变成一个带有两个红色子节点的节点，颜色翻转再把它拆开。按这个顺序的三个 `if` 可以在每层一次遍历中处理所有情况。

幻灯片 20 要求给出一个例子：若不按顺序执行检查，需要额外的工作——在 3-节点的两个键**之间**插入一个键，例如把 B 插入 3-节点 A C（C 带有红色左子节点 A）。B 成为 A 的红色右子节点：在 A 处左旋（现在 C–B–A 形成左-左红链接），在 C 处右旋（B 带有两个红色子节点 A 与 C），然后颜色翻转。现在假设把翻转放在右旋**之前**检查：在 C 处左孩子是红的但右孩子为空，所以不翻转；接着右旋让 B 带着两个红孩子——一个没有分裂的临时 4-节点，要等以后某次经过它时才会被修正。按幻灯片的顺序检查，每一步修正都恰好为同一节点上的下一步做好准备。

在幻灯片 21 的追踪（S E A R C H X M P L）上逐步演示，两种视图均可：

```viz llrb
{"title": "幻灯片 21：put S E A R C H X M P L", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(X); put(M); put(P); put(L)", "interactive": true}
```

> 📘 **课外补充**：幻灯片 19 只展示了递归的 `put`。公开的 `put` 还必须在每次插入后把**根染成黑色**：`root = put(root, key, val); root->color = BLACK;`。翻转可能会把根的链接变为红色；把它重新染成黑色就是树变高的方式——恰好对应 2-3 树的根分裂。（algs4 §3.3，"Keeping the root black"）

> ⚠️ **易错点**：`h = rotateLeft(h);`——旋转会返回新子树的根，必须把它保存下来（并在最后返回 `h`），就像 BST 的 `put` 返回其链接一样。如果只写 `rotateLeft(h);`，父节点就会仍然指向错误的节点。

> 📝 **练习**：[活动 2（11/17）](#163-活动-2构造一棵-llrb1117-课件幻灯片-21)——依次插入 S E A R C H X M P L，然后依次插入 A C E H L M P R S X。

## 11. LLRB 的时间分析与字典小结

**LLRB 的高度在最坏情况下 ≤ 2 lg n**（幻灯片 22）。最坏情况是：**最短**的从根到空链接的路径全部由黑链接组成（全部为 2-节点，约 lg n），而**最长**的路径则黑红交替（路径上每个节点都是 3-节点），因此它最多是前者的两倍长。由于所有路径的黑链接数量相同，任何路径都不可能超过该数量的两倍。

幻灯片 23 对字典（符号表）操作的小结：

| | 查找（最坏） | 插入（最坏） | 删除（最坏） | 查找（平均） | 插入（平均） | 删除（平均） |
|---|---|---|---|---|---|---|
| 顺序查找（无序列表） | n | n | n | n/2 | n | n/2 |
| 二分查找（有序数组） | log n | n | n | log n | n/2 | n/2 |
| BST | n | n | n | log n | log n | log n |
| 2-3 查找树 | c log n | c log n | c log n | c log n | c log n | c log n |
| 红黑 BST | 2 log n | 2 log n | 2 log n | 1 log n | 1 log n | 1 log n |

（这张表把 BST 的平均删除列为 log n；§1 中的 √n 是反复 Hibbard 删除后的结果。）因此 LLRB 在查找、插入和删除上都是**最坏 O(log n)**，实际上路径长度约为 lg n。

## 12. 哈希表：基本思想

平衡 BST 给出 O(log n)，并且保持键有序。**哈希表**的目标是键值对的查找、插入和删除都达到**平均 O(1)**；代价是键不再保持有序（幻灯片 25）。

Yeh 的比喻（幻灯片 26–30）：要在一堆衣服中找一件衬衫，你可以搜索无序的一堆（无序列表），也可以比较衣服并建立一棵树（BST）。而你实际上做的是**把衣服放进抽屉**。关于物品的信息告诉你**该把它放在哪里**，之后也告诉你**该去哪里找**：哈希表用数据本身的一个线索来决定每次操作的位置。

结构（幻灯片 31）：大量称为**桶**的小集合（`[0] … [m-1]`）构成哈希表，外加一条**规则——哈希函数**——把每个元素映射到某个桶（幻灯片 32：衬衫 → 哈希函数 → 3，即衬衫抽屉；毛衣 0、夹克 1、裤子 2、衬衫 3、袜子 4）。要查找某个东西，只需查看它所在的桶。

## 13. 哈希函数：哈希码 + 压缩

**第一次尝试**（幻灯片 33）：`hash_value = hash(input)`，其中 `hash = len(input)`，例如 "Prof Yeh" → 8。问题在于：8 并不是一个桶——只有 5 个桶，因此该值必须被压缩到索引范围内。

**第二次尝试，分两部分**（幻灯片 34）：

1. `hashCode()` 把输入映射为一个整数（**哈希码**）；
2. **压缩**把哈希码映射到桶的范围内：**`hash = hashCode(input) % numBuckets`**。

插入与查找使用的是**同一个**函数（幻灯片 35–36）。取 5 个桶，并以 `len` 作为哈希码：

| 输入 | hashCode = len | % 5 | 桶 |
|---|---|---|---|
| "Prof Yeh" | 8 | 8 % 5 | 3 |
| "Students" | 8 | 8 % 5 | 3 |

> 📘 **课外补充**：好的哈希函数应当是**确定性的**（相等的键得到相同的哈希值）、**快速的**，并且能把键**均匀分布**到 0 … m−1。`len` 在最后这一点上表现得非常糟糕。对于整数键，常用的选择是**模哈希** `k % m`，并让 **m 为质数**，这样键中的规律就不会与 m 对齐。（algs4 §3.4；Thornton 的信用卡例子展示了有偏的数字如何破坏哈希。）

> ⚠️ **易错点**：在 C++（与 Java 一样）中，**负数**的 `%` 结果为负，因此 `hashCode(key) % m` 可能得到像 −2 这样的索引。应使用无符号的哈希值（例如 `std::hash` 返回 `size_t`），或者在索引之前修正符号。

## 14. 冲突

当多个元素哈希到同一个桶时就发生了**冲突**（幻灯片 37–38）："Prof Yeh" 与 "Students" 都落在桶 3 中。一般而言冲突无法避免——可能的键远多于桶的数量——因此哈希表需要一种冲突解决策略。幻灯片 39 提问：如何让一个桶容纳多个元素，以及什么样的结构能让插入变快？答案是为每个桶配一个链表。

> ➡️ **续见 [Lecture 15](lec-15.zh-CN.md)**：冲突处理——拉链法（拉链法，其结构、S E A R C H 追踪、活动 3 与实现都会在那里重复）、线性探测与二次探测。

## 15. 完整实现

```cpp
#include <iostream>
#include <string>

template <typename Key, typename Value>
class LLRB {
    static const bool RED = true;
    static const bool BLACK = false;

    class Node {
    public:
        Key key;            // key
        Value val;          // associated data
        Node *left, *right; // links to left and right subtrees
        bool color;         // color of parent link
        int size;           // subtree count
        Node(const Key& k, const Value& v, bool c, int s)
            : key(k), val(v), left(nullptr), right(nullptr), color(c), size(s) {}
    };

    Node* root = nullptr;

    bool isRed(Node* x) const {
        if (x == nullptr) return false; // null links are black
        return x->color == RED;
    }
    int size(Node* x) const { return x == nullptr ? 0 : x->size; }

    Node* rotateLeft(Node* h) {
        Node* x = h->right;
        h->right = x->left;
        x->left = h;
        x->color = h->color;
        h->color = RED;
        x->size = h->size;
        h->size = size(h->left) + size(h->right) + 1;
        return x;
    }
    Node* rotateRight(Node* h) {
        Node* x = h->left;
        h->left = x->right;
        x->right = h;
        x->color = h->color;
        h->color = RED;
        x->size = h->size;
        h->size = size(h->left) + size(h->right) + 1;
        return x;
    }
    void flipColors(Node* h) {
        h->color = RED;
        h->left->color = BLACK;
        h->right->color = BLACK;
    }

    // insert the key-value pair in the subtree rooted at h
    Node* put(Node* h, const Key& key, const Value& val) {
        if (h == nullptr) return new Node(key, val, RED, 1); // Insert at bottom, color red

        if (key < h->key) h->left = put(h->left, key, val);   // Compare as before to traverse tree
        else if (key > h->key) h->right = put(h->right, key, val);
        else h->val = val;

        if (isRed(h->right) && !isRed(h->left))    h = rotateLeft(h);  // Fix any right-leaning links
        if (isRed(h->left) && isRed(h->left->left)) h = rotateRight(h); // 2 left red links
        if (isRed(h->left) && isRed(h->right))     flipColors(h);      // 4-node

        h->size = size(h->left) + size(h->right) + 1;
        return h;
    }

    Value get(Node* x, const Key& key) const {
        while (x != nullptr) {
            if      (key < x->key) x = x->left;
            else if (key > x->key) x = x->right;
            else                   return x->val;
        }
        return Value{};
    }

    int height(Node* x) const {
        if (x == nullptr) return 0;
        int l = height(x->left), r = height(x->right);
        return 1 + (l > r ? l : r);
    }
    void print(Node* x, std::ostream& out) const {   // in-order, red nodes marked *
        if (x == nullptr) return;
        print(x->left, out);
        out << (isRed(x) ? "*" : "") << x->key << ' ';
        print(x->right, out);
    }
    void destroy(Node* x) {
        if (x == nullptr) return;
        destroy(x->left); destroy(x->right); delete x;
    }

public:
    LLRB() = default;
    LLRB(const LLRB&) = delete;
    LLRB& operator=(const LLRB&) = delete;
    ~LLRB() { destroy(root); }

    void put(const Key& key, const Value& val) {
        root = put(root, key, val);
        root->color = BLACK;              // the root is always black
    }
    Value get(const Key& key) const { return get(root, key); }
    int size() const { return size(root); }
    int height() const { return height(root); }
    Key rootKey() const { return root->key; }
    void print(std::ostream& out) const { print(root, out); out << '\n'; }
};

int main() {
    LLRB<char, int> t;
    std::string keys = "SEARCHXMPL";
    for (int i = 0; i < (int)keys.size(); i++) t.put(keys[i], i);
    std::cout << "in-order: "; t.print(std::cout);
    std::cout << "root " << t.rootKey() << ", size " << t.size() << ", height " << t.height() << '\n';
    std::cout << "get(H) = " << t.get('H') << ", get(Z) = " << t.get('Z') << '\n';

    LLRB<char, int> u;
    std::string inc = "ACEHLMPRSX";
    for (int i = 0; i < (int)inc.size(); i++) u.put(inc[i], i);
    std::cout << "ascending: "; u.print(std::cout);
    std::cout << "root " << u.rootKey() << ", height " << u.height() << '\n';
}
```

输出（`*` = 来自父节点的链接为红色；height 统计最长路径上的节点数）：

```text
in-order: *A C E *H L M P R *S X 
root M, size 10, height 4
get(H) = 5, get(Z) = 0
ascending: A C E H L *M P R *S X 
root H, height 4
```

## 16. 课堂活动（附解答）

在打开解答之前，每个活动都先自己尝试。两份课件都从活动 1 开始编号，因此每个标题中都标明了课件日期。

### 16.1 活动 1：构造（11/10 课件，幻灯片 19）

画出依次在一棵初始为空的树中插入 E A S Y Q U T I O N 之后得到的 2-3 树。

> 提示：在插入 S、Q、T（先是一个叶子，然后是根）以及 O 时会发生分裂。

<details>
<summary>解答</summary>

| 插入 | 发生的事情 | 之后的树（从上到下的层级，`[ ]` = 一个节点） |
|---|---|---|
| E, A | 2-节点 → 3-节点 | [A E] |
| S | 根处的临时 4-节点 A E S → 分裂 | [E] / [A] [S] |
| Y | 插入到 2-节点 | [E] / [A] [S Y] |
| Q | 临时 4-节点 Q S Y → S 上推 | [E S] / [A] [Q] [Y] |
| U | 插入到 2-节点 | [E S] / [A] [Q] [U Y] |
| T | 临时 4-节点 T U Y → U 上推 → 根 E S U → 分裂 | [S] / [E] [U] / [A] [Q] [T] [Y] |
| I | 插入到 2-节点 | [S] / [E] [U] / [A] [I Q] [T] [Y] |
| O | 临时 4-节点 I O Q → O 上推 | [S] / [E O] [U] / [A] [I] [Q] [T] [Y] |
| N | 插入到 2-节点 | [S] / [E O] [U] / [A] [I N] [Q] [T] [Y] |

最终的树：根为 **S**；第二层为 **E O** 与 **U**；底层为 **A**、**I N**、**Q**（E O 的子节点）以及 **T**、**Y**（U 的子节点）。高度为 3，所有空链接位于相同的深度。验证一下：

```viz two-three-tree
{"title": "活动 1（11/10）检查：E A S Y Q U T I O N", "ops": "insert(E); insert(A); insert(S); insert(Y); insert(Q); insert(U); insert(T); insert(I); insert(O); insert(N)"}
```

</details>

返回 [§4](#4-2-3-树插入)。

### 16.2 活动 1：合法的 LLRB（11/17 课件，幻灯片 8）

下列哪些是合法的 LLRB 树？请把合法的 LLRB 转换为 2-3 树。（红链接标注为 "red"。）

- **(i)** C；C 的左子节点为 A（红色），右子节点为 Y；Y 的左子节点为 H；H 的左子节点为 D（红色）。
- **(ii)** E；E 的左子节点为 D（红色），右子节点为 H；D 的子节点为 C 与 F；C 的左子节点为 A（红色）；H 的子节点为 G 与 Z。
- **(iii)** E；子节点为 B 与 Y；B 的子节点为 A 与 D；Y 的子节点为 H 与 Z（均为黑色）。
- **(iv)** H；子节点为 C 与 Y；C 的左子节点为 A（红色）；Y 的左子节点为 T（红色）。

<details>
<summary>解答</summary>

**只有 (iii) 与 (iv)。**

- **(i)** 不是平衡的：路径 C → A → null 上有 1 条黑链接，而 C → Y → H → D → null 上有 3 条。（只有左子节点的 2-节点 Y 不可能出现在 2-3 树中。）
- **(ii)** 不满足对称序：F 位于 D 的右子树中，因此它必须位于 D 与 E 之间，但 F > E（中序为 A C D F E G H Z）。它也不是平衡的。
- **(iii)** 没有红链接，且每条从根到空链接的路径上都有 3 条黑链接 → 合法。它对应的 2-3 树形状相同：根 [E]，然后是 [B] [Y]，接着是 [A] [D] [H] [Z]——全部都是 2-节点。
- **(iv)**：两条红链接都向左倾斜，没有节点与两条红链接相连，每条路径上都有 2 条黑链接 → 合法。对应的 2-3 树：根 [H]，子节点为 **[A C]** 与 **[T Y]**。

对照三条规则检查每棵树（切换到 2-3 视图以进行转换）：

```viz llrb
{"title": "活动 1（11/17）检查：树 (iv)", "tree": "H, C, Y, *A, -, *T", "ops": "check()"}
```

```viz llrb
{"title": "活动 1（11/17）检查：树 (i)", "tree": "C, *A, Y, -, -, H, -, -, -, -, -, *D", "ops": "check()"}
```

</details>

返回 [§7](#7-llrb-的定义)。

### 16.3 活动 2：构造一棵 LLRB（11/17 课件，幻灯片 21）

按顺序插入构造 LLRB：**S E A R C H X M P L**，然后（分别）插入 **A C E H L M P R S X**。

> 提示：每次插入之后，自底向上执行三个检查，最后把根染成黑色。

<details>
<summary>解答</summary>

**S E A R C H X M P L**——每次插入后的修复（自底向上）：

| 插入 | 修复 |
|---|---|
| S, E | 无（E 是 S 的红色左子节点） |
| A | 在 S 处右旋，在 E 处颜色翻转，根染黑 |
| R | 无 |
| C | 在 A 处左旋 |
| H | 在 S 处右旋，在 R 处翻转，在 E 处左旋 → R 为根，E 为其红色左子节点 |
| X | 在 S 处左旋 |
| M | 在 H 处左旋 |
| P | 在 M 处翻转（子节点为 H、P）；在 E 处左旋；在 R 处右旋；在 M 处再次翻转；根染黑（高度增加） |
| L | 在 H 处左旋 |

最终结果：根为 **M**；其下为 **E** 与 **R**；E 的子节点为 **C**（带有红色左子节点 A）与 **L**（带有红色左子节点 H）；R 的子节点为 **P** 与 **X**（带有红色左子节点 S）。作为 2-3 树：[M] / [E] [R] / [A C] [H L] [P] [S X]。

**A C E H L M P R S X**（升序）：新键总是落在右边，因此几乎每次插入都从一次左旋开始，并且每当右侧的脊柱填满时，颜色翻转就会向上传播。最终结果：根为 **H**；**C**（子节点为 A、E）与 **R**；R 的左子节点 **M** 为红色（M 的子节点为 L、P），R 的右子节点 **X** 带有红色左子节点 **S**。作为 2-3 树：[H] / [C] [M R] / [A] [E] [L] [P] [S X]。升序输入正是普通 BST 的最坏情况，但在这里仍然得到高度 4。

```viz llrb
{"title": "活动 2 检查：升序输入", "ops": "put(A); put(C); put(E); put(H); put(L); put(M); put(P); put(R); put(S); put(X)"}
```

</details>

返回 [§10](#10-llrb-插入)。

## 17. 速查与必记的 5 个要点

| 结构 | 查找 | 插入 | 删除 | 原因 |
|---|---|---|---|---|
| BST | 最坏 O(n)，平均 O(log n) | 最坏 O(n) | 最坏 O(n)，多次 Hibbard 删除后平均 √n | 高度取决于插入顺序 |
| 2-3 树 | 最坏 O(log n) | 最坏 O(log n) | 最坏 O(log n) | 完美平衡；高度介于 log₃ n 与 lg n 之间 |
| LLRB | 最坏 O(log n) | 最坏 O(log n) | 最坏 O(log n) | 高度 ≤ 2 lg n；平均路径 ≈ lg n |
| 哈希表 | 平均 O(1) | 平均 O(1) | 平均 O(1) | 取决于哈希函数（见 Lecture 15） |

| LLRB 修复（按此顺序检查） | 条件 | 操作 |
|---|---|---|
| 1 | 右子节点为红，左子节点为黑 | `h = rotateLeft(h)` |
| 2 | 左子节点为红，且其左子节点也为红 | `h = rotateRight(h)` |
| 3 | 两个子节点都为红 | `flipColors(h)` |

**必记的 5 个要点**

1. 2-3 树插入：加入底层节点；3-节点变为临时 4-节点，将其分裂并把中间键上推，并沿树重复；只有根的分裂才会使高度增加，因此完美平衡始终成立。
2. LLRB 就是以 BST 形式画出的 2-3 树：红链接把 3-节点的两个键粘合在一起，红链接向左倾斜，没有节点与两条红链接相连，并且每条从根到空链接的路径上黑链接数量相同。
3. LLRB 的 `put` = 带红链接的 BST 插入，然后沿路径向上：左旋（右侧为红）、右旋（连续两条左红）、颜色翻转（两个红色子节点）——按此顺序——最后把根染成黑色。
4. 高度 ≤ 2 lg n（最长路径黑红交替，最短路径全黑），因此查找、插入和删除在最坏情况下都是 O(log n)。
5. 哈希函数 = 哈希码 + 压缩（`hashCode(key) % m`）；它同时决定插入与查找的桶，并且必须处理冲突（两个键，一个桶）。
