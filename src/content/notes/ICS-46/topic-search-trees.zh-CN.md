---
title: "搜索树"
summary: "二叉搜索树（对称序、Node 类、查找、插入、形状与高度、Hibbard 删除）、2-3 树（查找、插入、高度），以及左倾红黑 BST（定义、旋转、颜色翻转、插入、2 lg n 高度），并附字典操作小结表。"
topics:
  - search-trees
kind: "topic"
order: 507
---

# 信息与计算机科学 46 — 话题：搜索树

## 目录

- [1. 二叉搜索树](#1-二叉搜索树)
- [2. BST 查找](#2-bst-查找)
- [3. BST 插入](#3-bst-插入)
- [4. 树的形状与运行时间](#4-树的形状与运行时间)
- [5. Hibbard 删除](#5-hibbard-删除)
- [6. BST 小结：为什么需要平衡](#6-bst-小结为什么需要平衡)
- [7. 2-3 树](#7-2-3-树)
- [8. 左倾红黑 BST（LLRB）](#8-左倾红黑-bstllrb)
- [9. 完整实现](#9-完整实现)
- [10. 速查与五个要点](#10-速查与五个要点)

> UCI ICS 46：数据结构的实现与分析 — Tom Yeh 教授。本笔记把第 12–14 讲中的搜索树内容汇集在一起，按概念组织。

## 1. 二叉搜索树

### 1.1 对称序

一个 **二叉搜索树（BST）** 是处于 **对称序** 中的二叉树：每个节点都有一个键，并且该键

- **大于** 其左子树中的所有键，并且
- **小于** 其右子树中的所有键。

重复键可以用不同方式处理，但 **我们假设不存在重复键**。可选教材用 BST 来实现 **字典**，因此每个节点保存一个 **键-值对**；其他实现（例如集合）只保存键。

示例（贯穿全节的树）：根为 S；左子树的根为 E，它有子节点 A 和 R；右子节点为 X。小于 E 的键（A、C）位于 E 的左链接之下，介于 E 与 S 之间的键（H、M、R）位于 E 的右链接之下。对该树做 **中序** 遍历（[树](topic-trees.zh-CN.md)）会按排序顺序访问各个键：A C E H M R S X。

> ⚠️ **易错点**：规则针对的是 **整棵子树**，而不仅仅是子节点。一棵每个左子节点都小于父节点、每个父节点都小于右子节点的树仍然可能出错，例如：根为 8，其左子节点为 3，而 3 的右子节点为 9：9 位于 8 的 *左* 子树中，但它大于 8。

### 1.2 堆与 BST

堆和 BST 都是二叉树，但解决的问题不同：

| | 堆 | BST |
|---|---|---|
| 用于实现 | 优先队列 | 有序字典 |
| 支持的操作 | 插入、删除最大值 | 插入、查找、删除、有序操作 |
| 插入的内容 | 键 | 键-值对 |
| 底层数据结构 | （可扩容的）数组 | 链式节点 |
| 树的形状 | 完全二叉树 | 取决于数据 |
| 键的排列 | 堆序 | 对称序 |
| 是否允许重复键？ | 允许 | 不允许（用于实现字典时） |

堆这一侧的内容见 [堆](topic-heaps.zh-CN.md)。

### 1.3 Node 类

BST 使用一个内部类 `Node`，它由以下部分组成：

- 一个 **键（Key）** 和一个 **值（Value）**（即字典中的键值对）；
- **指向左子树（较小的键）和右子树（较大的键）根节点的指针**；
- 可选地，一个 **节点计数器**：以该节点为根的子树中的节点数。它能加速某些操作，例如查找第 k 小或第 k 大的键。

BST 本身只保存 `Node* root`。幻灯片中的代码如下：

```cpp
template <template Key, typename Value>
class BST {
private:
    class Node {
        Key key;            // sorted by key
        Value val;          // associated value
        Node* left, right;  // roots of left and right subtrees
        int size;           // #nodes in subtree rooted at this

        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };

    Node* root;             // root of BST
};
```

幻灯片中代码的错误（按幻灯片所示，无法编译）：

- `template <template Key, …>` → `template <typename Key, typename Value>`。
- `Node* left, right;` 把 `right` 声明为 `Node` 而不是 `Node*`（`*` 只绑定到一个名字上）→ 改为 `Node* left, *right;` 或分成两条声明。
- `class Node` 使所有成员都为私有，因此 `BST` 的方法无法读取 `x->key` → 使用 `struct Node` 或添加 `public:`。

修正后的版本见 [§9.1](#91-bst)。`put` 还需要一个 `size(Node*)` 辅助函数，对 `nullptr` 返回 0；幻灯片用到了它，却没有展示。

## 2. BST 查找

### 2.1 算法

从根节点开始比较：

- 若键 **小于** 节点的键，则进入 **左** 子树；
- 若键 **大于**，则进入 **右** 子树；
- 若两者 **相等**，则为 **查找命中**。

返回该键对应的节点指针；若不存在该键，则返回 `nullptr`（某些实现会返回所遇到的最后一个节点）。**比较次数 = 节点深度 + 1。**

递归版本改为返回值，未命中时返回 `Value()`：

```cpp
Value get(const Key& key) const {
    return get(root, key);
}

Value get(Node* x, const Key& key) const {
    if (x == nullptr)
        return Value();
    if (key < x->key)
        return get(x->left, key);
    else if (key > x->key)
        return get(x->right, key);
    else
        return x->val;
}
```

以 S-E-X-A-R-C-H-M 树为例：**查找 R**——R < S，向左；R > E，向右；R == R，命中（共比较 3 次；R 位于深度 2）。**查找 T**——T > S，向右；T < X，向左；该链接为空，因此未命中。逐步执行这两个查找：

```viz bst
{"title": "查找命中（R）与查找未命中（T）", "keys": "S, E, X, A, R, C, H, M", "ops": "get(R); get(T)", "interactive": true}
```

> ⚠️ **易错点**：未命中时返回的 `Value()` 有歧义——存储的值也可能恰好等于 `Value()`（对 `int` 来说即 0）。这正是另一版本返回节点指针（`nullptr` 表示未命中）的原因。

### 2.2 练习

#### 在 BST 中查找

在这棵 BST 中查找键 4 和 9（下面的插入与删除练习还会再次用到它）：

```viz binary-tree
{"title": "练习用 BST", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13"}
```

> 提示：数一数比较的次数。

<details>
<summary>解答</summary>

**4：** 4 < 8 → 左；4 > 3 → 右；4 < 6 → 左；4 == 4 → **命中**，共 4 次比较（深度 3 + 1）。**9：** 9 > 8 → 右；9 < 10 → 左；10 的左链接为空 → **未命中**（`nullptr` / `Value()`），共 2 次比较。

</details>

## 3. BST 插入

### 3.1 算法

插入沿着查找路径进行：

- 小于节点的键 → 向左；大于 → 向右；
- **若到达空链接，则在此处插入** 一个新节点；
- **若键已存在，则更新其值**（不允许重复键）。

比较次数 = 节点深度 + 1。（algs4 的 *3.2 Binary Search Tree Demo* 对此做了动画演示。）代码如下：

```cpp
void put(const Key& key, const Value& val) {
    root = put(root, key, val);
}

Node* put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr)
        return new Node(key, val, 1);
    if (key < x->key)
        x->left = put(x->left, key, val);
    else if (key > x->key)
        x->right = put(x->right, key, val);
    else
        x->val = val;
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

每次调用都返回其（可能已改变的）子树的根，调用者再把它存回自己的链接中。只有底部的空链接会发生改变。回溯时，其余的赋值语句会写回相同的指针，并重新计算 `size` 字段。

示例：以 S-E-X-A-R-C-H-M 树为例，**插入 L**：L < S → 向左到 E；L > E → 向右到 R；L < R → 向左到 H；L > H → 向右到 M；L < M，且 M 的左链接为空 → 在此处创建节点。然后在回溯过程中重置链接并递增计数。

```viz bst
{"title": "插入 L", "keys": "S, E, X, A, R, C, H, M", "ops": "put(L)"}
```

> ⚠️ **易错点**：写成 `put(x->left, key, val);` 却不赋值，会丢失新节点，只有返回的指针才会被挂入树中。公有方法中的 `put(root, …)` 也是同样的道理。

### 3.2 练习

#### 向 BST 中插入

怎样在保持对称序的前提下向 BST 添加元素？在上文 [§2.2](#22-练习) 的练习 BST 中加入键值对 (4,3) 和 (9,2)。（节点中只显示键。）

> 提示：其中一个键已经在树中。

<details>
<summary>解答</summary>

**(4,3)：** 查找路径 8 → 3 → 6 → 4 结束于一个已存在的节点，因此 **只更新其值** 为 3；树的形状不变。**(9,2)：** 9 > 8 → 右；9 < 10 → 左；为空 → **新节点 9（值 2）成为 10 的左子节点**。将二者与查找练习一起检查：

```viz bst
{"title": "查找与插入练习检查", "keys": "8, 3, 10, 1, 6, 14, 4, 7, 13", "ops": "get(4); get(9); put(4, 3); put(9, 2)"}
```

</details>

## 4. 树的形状与运行时间

**同一组键**，根据 **插入顺序** 的不同，会得到 **不同的 BST**：

- **最好情况：** 完全平衡，例如 H 为根，其下为 C 和 S，再往下为 A E R X；
- **典型情况：** 略有不平衡，高度是 log n 的小倍数；
- **最坏情况：** 按排序顺序插入键（A C E H R S X）会形成一根"棍子"。每个节点都只有右子节点，因此高度为 n。

由于查找和插入的比较次数 = 深度 + 1，其代价为 **O(height)**：

- 若 n 个不同的键以 **随机顺序** 插入，查找/插入的期望比较次数为 **O(log n)**，期望高度同为 O(log n)。
- **最坏情况下的高度为 n**：键必须按升序（或降序）到达。此时查找、插入和删除均为 **O(n)**。

示例：插入 H C S A E R X（先插中位数，再依次插入各半区的中位数）得到高度为 3 的最好情况树；插入 A C E H R S X 则得到高度为 7 的树。

> 📘 **课外补充**：随机顺序下的常数约为 1.39：由 n 个随机键构建的 BST 中，一次查找命中、未命中或插入平均需要约 2 ln n ≈ 1.39 lg n 次比较——仅比完全平衡的树多约 39%。任何把 H 放在最前、让 C 先于 A 和 E、让 S 先于 R 和 X 的顺序，都能得到最好情况的树。（algs4 §3.2）

## 5. Hibbard 删除

### 5.1 三种情形

删除是较难的操作，因为移除一个有两个子节点的节点后，会留下两棵子树，却只有一个父链接可以用来挂接它们。**Hibbard 删除** 分为三种情形：

1. **叶节点：** 直接删除该节点（其父节点的链接变为空）。例如：在树 46 / 34, 70 / 11, 44, 52（52 是 70 的左子节点）/ 6, 19 中删除 52。
2. **一个子节点：** 删除该节点，并用其子节点替代它。例如：从同一棵树中删除 70；52 顶替它，成为 46 的右子节点。
3. **两个子节点：** 用其 **后继**（树中下一个更大的键）替代该节点。后继即 **右子树中的最小节点**，也就是右子树中 **最左的节点**。后继没有左子节点。把后继的右子节点（若有）移到后继原来的位置。例如：从 50 / 29, 65 / 11, 32, 51, 91 / 52, 72, 99 中删除 50。后继是 51（先向右到 65，再向左到 51）。51 替代 50，而 51 的右子节点 52 成为 65 的左子节点。

这种交换保持了对称序：后继大于左子树中的所有键，并且小于右子树中剩下的所有键，因为被删键与其后继之间不存在其他键。

### 5.2 代码

幻灯片只描述了各种情形，没有给出代码。以下是按 `put` 风格编写的完整版本（我们自己的实现）：

```cpp
Node* remove(Node* x, const Key& key) {
    if (x == nullptr) return nullptr;           // key not found
    if (key < x->key)
        x->left = remove(x->left, key);
    else if (key > x->key)
        x->right = remove(x->right, key);
    else {
        if (x->right == nullptr) {              // case 1, or case 2 (left child only)
            Node* l = x->left;
            delete x;
            return l;
        }
        if (x->left == nullptr) {               // case 2 (right child only)
            Node* r = x->right;
            delete x;
            return r;
        }
        Node* t = x;                            // case 3
        x = min(t->right);                      // successor
        x->right = deleteMin(t->right);         // unlink it from the right subtree
        x->left = t->left;
        delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

`min` 沿左链接一直走到尽头；`deleteMin` 通过返回最小节点的右子树来代替它，从而摘除该最小节点（两者都在 [§9.1](#91-bst) 中）。之所以命名为 `remove`，是因为 `delete` 是 C++ 关键字。逐步执行情形 3 的示例（可尝试 `remove(11)` 体验情形 1，或 `remove(91)` 体验后继位置更深的情形 3）：

```viz bst
{"title": "情形 3：删除 50", "keys": "50, 29, 65, 11, 32, 51, 91, 52, 72, 99", "ops": "remove(50)", "interactive": true}
```

**代价：** 找到节点及其后继，都只需沿同一条路径向下走一次：**O(height)**。

> ⚠️ **易错点**：在情形 3 中，必须先设置 `x->right = deleteMin(t->right)`，**然后** 再设置 `x->left = t->left`。当后继恰好是 t 自己的右子节点时（如下文练习中删除 6），若先设置左链接，`deleteMin(t->right)` 会从后继开始，沿其新的左链接进入旧的左子树，从而摘除错误的节点。

### 5.3 练习

#### 从 BST 中删除

怎样在保持对称序的前提下删除键值对？请从原始的练习 BST（[§2.2](#22-练习)）中分别删除以下每个节点，每次只删一个：

- 删除 1
- 删除 14
- 删除 6
- 删除 3
- 删除 8

> 提示：在重画树之前，先说出每一次删除属于哪种情形。

<details>
<summary>解答</summary>

| 删除 | 情形 | 结果（`key(left right)`，`-` 表示空） |
|---|---|---|
| 1 | 叶节点 | 8(3(- 6(4 7)) 10(- 14(13 -))) |
| 14 | 一个子节点 → 13 上移 | 8(3(1 6(4 7)) 10(- 13)) |
| 6 | 两个子节点；后继为 7（6 的右子节点，没有左子节点） | 8(3(1 7(4 -)) 10(- 14(13 -))) |
| 3 | 两个子节点；后继为 4 = 以 6 为根的子树中的最小值 | 8(4(1 6(- 7)) 10(- 14(13 -))) |
| 8 | 两个子节点；后继为 10 = 右子树中的最小值（10 没有左子节点），因此 10 的右子树保持不动 | 10(3(1 6(4 7)) 14(13 -)) |

陷阱在于 **删除 3**：它的后继不是其右子节点 6，而是 6 之下最左的节点，即 4。

</details>

#### Hibbard 删除根节点

在树 21 / 10, 79 / 73, 95 / 70, 74（73 的子节点）/ 71（70 的右子节点）中，按 Hibbard 删除法删除节点 21。

<details>
<summary>解答</summary>

21 有两个子节点 → 情形 3。后继是右子树中的最小值：79 → 73 → **70**（70 没有左子节点）。70 的右子节点 **71 上移，成为 73 的左子节点**，然后 70 取代 21 的位置：**70 / 10, 79 / 73, 95 / 71, 74**。检查如下：

```viz bst
{"title": "Hibbard 练习检查：删除 21", "keys": "21, 10, 79, 73, 95, 70, 74, 71", "ops": "remove(21)"}
```

</details>

## 6. BST 小结：为什么需要平衡

- 随机插入得到的 BST 具有 **平均 O(log n) 的高度**，因此查找和添加平均为 O(log n)。
- 按排序顺序插入会得到最坏情况的"棍子"，因此 BST 的查找、插入和删除在 **最坏情况下为 O(n)**。
- 插入与 **Hibbard 删除** 混合使用会使 BST **失衡，向左倾斜**。删除总是从右子树取后继，因此右子树不断缩小（完整树与左重树的对比）。

*我们能如何处理删除带来的不对称？* **对称 Hibbard 删除：** 在后继与 **前驱**（左子树中最大的键）之间交替选择，或随机选择。经验上它能使树高保持接近 O(log n)，但 **尚无形式化证明**。

即便如此，这些都无法解决最坏情况：BST 的最坏操作仍为 O(n)。符号表的增长阶表格对此问题做了全面概括：

| | 查找（最坏） | 插入（最坏） | 删除（最坏） | 查找（平均） | 插入（平均） | 删除（平均） |
|---|---|---|---|---|---|---|
| BST | n | n | n | log n | log n | √n |
| **目标** | **log n** | **log n** | **log n** | **log n** | **log n** | **log n** |

最坏情况是来自有序输入的"棍子"（A C E H R S X）；随机输入给出 log n，但 Hibbard 删除会使平均删除代价漂移到 √n。**平衡查找树** 保证每种操作都是 log n。红黑树被用作系统符号表（例如 C++ `std::map`）；AVL、伸展树和随机化 BST 是其他平衡 BST。Yeh 讲授的是 **左倾红黑树（LLRB）**，要理解它，我们先从 2-3 树开始。

## 7. 2-3 树

### 7.1 定义

一个 2-3 树的节点可以保存 **一个或两个键**：

- **2-节点**：1 个键（及其值），**2 条链接**——左子树更小，右子树更大（即一个普通的 BST 节点）。
- **3-节点**：2 个键（及其值），**3 条链接**——左（< 键1）、中（介于键1与键2之间）、右（> 键2）。

以下两条性质始终成立：

- **对称序**：中序遍历按升序给出所有键。
- **完美平衡**：从根到任意空链接的每条路径长度完全相同。

全文使用的"解剖"树（根为 M；其下为 E J 和 R；底层为 A C、H、L、P、S X）：

```viz two-three-tree
{"title": "2-3 查找树的解剖：查找 H", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "get(H)"}
```

（该演示通过以合适的顺序插入这些键来构建这棵树；同一节点的键用粗条连接。）

### 7.2 查找

将查找键与节点中的 **每一个键** 比较，找出包含它的区间（左、若是 3-节点则为中间，或右），沿该链接前进，然后重复。在上面的树中查找 **H**：H < M → 左；H 位于 E 与 J 之间 → 中间；找到 H → 返回其值（查找命中）。若在空链接处结束，则为未命中。

### 7.3 插入

先查找该键；查找会结束于底层的某个节点。然后：

1. **插入到 2-节点中**：加入该键，使其变为 3-节点。完成。（插入 K → 2-节点 L 变为 K L。）
2. **插入到 3-节点中**：加入该键，形成一个 **临时 4-节点**（3 个键，4 条链接），然后将其拆分为两个 2-节点，并 **把中间键上推到父节点**：
   - 树只是一个 3-节点（在 A E 中插入 S → A E S）：中间键 E 成为新根，其子节点为 A 和 S。**高度增加 1**。
   - 父节点是 2-节点（在 S X 中插入 Z → S X Z）：X 上推，父节点 R 变为 3-节点 R X。完成。
   - 父节点是 3-节点（在 A C 中插入 D → A C D）：C 上推，父节点 E J 变为临时 4-节点 C E J；再次拆分，E 上推到 M。**必要时沿树向上重复。**
3. **拆分根节点**：若根最终变为临时 4-节点，则将其拆分为 **三个 2-节点**。高度增加 1，但完美平衡得以保持——2-3 树是在 **顶部** 生长，而不是在底部。

在"解剖"树上逐步执行这些示例（演示获得焦点时，← / → 键可用）：

```viz two-three-tree
{"title": "插入 K、Z、D", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "insert(K); insert(Z); insert(D)", "interactive": true}
```

每一次变换都是 **局部的**：它只改变常数个链接，并上推一个键；树的其他部分不受影响。这正是每次插入之后顺序与平衡都得以保持的原因。（algs4 *3.3 2-3 Tree Demo* 对此做了动画演示。）

> ⚠️ **易错点**：新键永远不会放入底层的新节点——那样会破坏完美平衡。它总是加入一个已有的底层节点；只有根的拆分才会增加一层。

### 7.4 性能

含 n 个键的 2-3 树的高度：

- **最坏情况：lg n**——全部为 2-节点（一棵完美二叉树）。
- **最好情况：log₃ n ≈ 0.631 lg n**——全部为 3-节点。

因此查找和插入至多访问约 lg n 个节点：保证为 **O(log n)**，并且 2-3 树在字典表的每一列中都是 log n（见 [§8.6](#86-时间分析与字典小结)）。对于一百万个键，层数在 12 到 20 之间。

难点在于代码：两种节点类型、把 2-节点转换为 3-节点、拆分 4-节点，情形众多。正是这种复杂性促使了 LLRB 的诞生。

### 7.5 练习

#### 构造 2-3 树

在一棵初始为空的树中，按顺序插入键 E A S Y Q U T I O N，画出得到的 2-3 树。

> 提示：在插入 S、Q、T（两次：一次在叶节点，一次在根）以及 O 时会发生拆分。

<details>
<summary>解答</summary>

| 插入 | 发生了什么 | 之后的树（自上而下分层，`[ ]` = 一个节点） |
|---|---|---|
| E, A | 2-节点 → 3-节点 | [A E] |
| S | 根上的 4-节点 A E S → 拆分 | [E] / [A] [S] |
| Y | 插入到 2-节点 | [E] / [A] [S Y] |
| Q | 4-节点 Q S Y → S 上推 | [E S] / [A] [Q] [Y] |
| U | 插入到 2-节点 | [E S] / [A] [Q] [U Y] |
| T | 4-节点 T U Y → U 上推 → 根 E S U → 拆分 | [S] / [E] [U] / [A] [Q] [T] [Y] |
| I | 插入到 2-节点 | [S] / [E] [U] / [A] [I Q] [T] [Y] |
| O | 4-节点 I O Q → O 上推 | [S] / [E O] [U] / [A] [I] [Q] [T] [Y] |
| N | 插入到 2-节点 | [S] / [E O] [U] / [A] [I N] [Q] [T] [Y] |

最终的树：根为 **S**；第二层为 **E O** 和 **U**；底层为 **A**、**I N**、**Q**（E O 的子节点）以及 **T**、**Y**（U 的子节点）。高度为 3，所有空链接位于同一深度。检查如下：

```viz two-three-tree
{"title": "2-3 树构造检查：E A S Y Q U T I O N", "ops": "insert(E); insert(A); insert(S); insert(Y); insert(Q); insert(U); insert(T); insert(I); insert(O); insert(N)"}
```

</details>

## 8. 左倾红黑 BST（LLRB）

### 8.1 用 BST 表示 2-3 树

**用普通 BST 来表示 2-3 树**：

- 从一棵由 2-节点构成的标准 BST 开始。
- **红链接把两个 2-节点"粘合"成一个逻辑上的 3-节点。** 3-节点 (a, b) 变为以 a 为左子节点的 b，二者由一条红链接相连：小于 a 的键挂在 a 的左侧，介于 a 与 b 之间的键挂在 a 的右侧，大于 b 的键挂在 b 的右侧。
- **黑链接** 把 2-3 树绑定在一起。
- 红链接是内部的，并且 **向左倾斜**。

这是一种 **一一对应**：把红链接画成水平方向并收缩它们连接的节点，就能得到原来的 2-3 树。由于黑链接恰好就是 2-3 树的链接，LLRB 保持 **完美的黑色平衡**。其优点是：**BST 代码只需极少修改即可工作**。使用 View 开关可以在 LLRB 视图和 2-3 视图（红链接展平）之间切换：

```viz llrb
{"title": "示例树作为 LLRB", "tree": "M, J, R, *E, L, P, X, C, H, -, -, -, -, *S, -, *A"}
```

### 8.2 LLRB 的定义

左倾红黑树是满足以下条件的 BST：

1. **不存在两条连续的红链接**：没有节点同时连接两条红链接。
2. **左倾**：每条红链接都向左倾斜。
3. **完美黑色平衡**：从根到任意空链接的每条路径上，黑链接的数量都相同。

规则 1 意味着不存在 4-节点；规则 2 意味着每个 3-节点只有一种固定形状；规则 3 就是 2-3 树的完美平衡。

### 8.3 查找与 Node 类

**查找与 BST 查找完全相同**——颜色被忽略——但由于树是平衡的，它运行得更快：

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

由于没有链接对象，**每个节点存储其父链接的颜色**：`true` = 红，`false` = 黑，空链接始终为黑。

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

图中，`h->left->color` 为 RED（E–C 是红色），`h->right->color` 为 BLACK（E–J 是黑色）。

> ⚠️ **易错点**：颜色是 *指向* 某节点的链接的属性，而不是节点"自身"的属性。"C 是红色"意味着"从 C 的父节点到 C 的链接是红色"。根没有父链接，因此根始终为黑色。

### 8.4 旋转与颜色翻转

插入可能暂时破坏颜色规则；三种 O(1) 操作可以修复它们。幻灯片以图示展示了它们；下面的代码是 Yeh 的 C++ 风格下的标准 algs4 版本（包括 `size` 的更新，以保证计数正确）：

- **左旋**：把 h 与其右子节点 x 之间（暂时）右倾的红链接，转为左倾的红链接。x 取代 h 的位置并继承 h 的颜色；h 成为 x 的红色左子节点；x 原来的左子树（介于 h 与 x 之间的键）成为 h 的右子树。
- **右旋**：镜像操作——把左倾的红链接转为（暂时）右倾。
- **颜色翻转**：一个拥有两个红色子节点的节点是临时的 4-节点。将两个子节点变为黑色，并将该节点自身的链接变为红色：中间键上移到其父节点的 2-3 节点中——这就是 4-节点的拆分。

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

下面逐步说明每个操作，每一步一条语句（h 和 x 是局部指针；节点的填充色表示其父链接的颜色；用数字代替幻灯片中的字母）。三个演示属于同一个故事，即把 `put(35)` 的末尾放入这棵 LLRB 中：作为 2-3 树，根为 **[20 60]**，子节点为 **10**、**[30 40]**、**70**。35 落在 30 与 40 之间，该 3-节点拆分，35 上移到 **[20 60]** 中——因此这些演示从拆分之后开始，且每棵子树都非空：x 的内部子树是一个真实节点（先是 30，然后是 40），它必须移动；在第一次旋转中 h 为红色，因此 x 继承 **红色**。演示省略了上述代码中的两行 `size` 语句，它们只用于保持子树计数正确。你可以在第一个演示中输入自己的树：

```viz rb-rotation
{"title": "put(35)，拆分之后：rotateLeft(20) —— h 为红色且有父节点", "op": "rotateLeft", "interactive": true}
```

用文字说明 `rotateLeft`：x = h 的右子节点（35）；h 的右链接接过 x 的左子树（30，即 20 与 35 之间的键）；x 的左链接指向 h；x 继承 h 的颜色——此处为 **红色**，因为 20 是 3-节点中红色的左键；h 变为红色；`return x`，此时 60 的左链接指向 35。树仍不合法：60 → 35 → 20 是连续两条红色左链接。

```viz rb-rotation
{"title": "然后 rotateRight(60) —— x 的右子树 40 移过来", "op": "rotateRight"}
```

`rotateRight` 是镜像：x = h 的左子节点（35）；h 的左链接接过 x 的右子树（40，即 35 与 60 之间的键）；x 的右链接指向 h；x 继承 h 的颜色（这次为黑色）；h 变为红色。现在 35 有两个红色子节点：形成了临时的 4-节点 20 35 60。

```viz rb-rotation
{"title": "然后 flipColors(35)，put() 将根染黑", "op": "flipColors"}
```

`flipColors` 完全不移动指针：h 变为红色，两个子节点变为黑色，从而拆分了 4-节点。35 在这里是根，因此 `put()` 中的 `root->color = BLACK` 将其重新着色，树增加一层：2-3 树 [35] / [20] [60] / 10、30、40、70——一棵合法的 LLRB。

> 📘 **课外补充**：旋转会改变三个指针，并保持对称序——三棵子树（小于 E、介于 E 与 S 之间、大于 S）仍保持相同的从左到右顺序。无论是旋转还是翻转，都不会改变任意根到空链接路径上的黑链接数量，这正是它们保持完美黑色平衡的原因。（algs4 §3.3；Thornton 的 AVL 笔记使用的也是同样的旋转。）

### 8.5 LLRB 插入

**策略**：保持与 2-3 树的一一对应。在每一步中，对称序与完美黑色平衡都得到维持，但颜色不变式可能被暂时破坏：右倾红链接、两个红色子节点（临时 4-节点）、左-左红链接或左-右红链接（两个临时 4-节点）。旋转和颜色翻转会恢复这些不变式。

算法如下：

1. 执行标准的 BST 插入，并把新链接 **染成红色**（新键加入一个已有的 2-3 节点）。
2. 重复以下步骤直到颜色不变式恢复，沿路径回溯时进行：
   - 右链接为红色（左链接为黑色）？→ **左旋**；
   - 连续两条左红链接？→ **右旋**；
   - 两个子节点都是红色？→ **颜色翻转**。

代码如下：

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

幻灯片的错误：[§8.3](#83-查找与-node-类) 中的 `Node` 是一个没有构造函数的普通类（也没有模板参数），因此 `new Node<Key,Value>(key, val, RED, 1)` 按幻灯片所示无法编译——需要为 `Node` 提供构造函数 `Node(key, val, color, size)`，并将两个链接都设为 `nullptr`，如 [§9.2](#92-llrb) 所示。

**三个检查的顺序很重要**：每一次修复都恰好产生下一个检查所寻找的情形——左旋可能产生连续两条左红链接，右旋会把它变成一个拥有两个红色子节点的节点，颜色翻转随后将其拆分。按这三个 `if` 的顺序，每层只需一遍即可处理所有情形。

一个在顺序错误时需要额外工作的例子：在 3-节点的两个键之间插入一个键，例如把 35 插入到 3-节点 30 40 中（40 带有红色左子节点 30）。35 成为 30 的红色右子节点：在 30 处左旋（现在 40–35–30 为左-左红链接），在 40 处右旋（35 带有两个红色子节点 30 和 40），然后颜色翻转。现在假设先检查翻转、再进行右旋：在 40 处左子节点为红色，但右子节点为空，因此不执行翻转；然后右旋使 35 拥有两个红色子节点——这是一个未拆分的临时 4-节点，直到之后某次遍历到它时才会被修复，在此之前一直保持错误。按正确顺序检查时，每次修复都会在同一节点上为下一次修复做好准备。`put(35)`（见 [§8.4](#84-旋转与颜色翻转)）中从新建红节点向上的整个过程，会在更高一层的 20 和 60 处再次执行同样的三种修复：

```viz rb-rotation
{"title": "完整的 put(35)，先在 30 / 40 处修复，再在 20 / 60 处修复", "op": "rotateLeft(30), rotateRight(40), flipColors, rotateLeft(20), rotateRight(60), flipColors"}
```

逐步执行插入 S E A R C H X M P L 的过程，两种视图均可：

```viz llrb
{"title": "插入 S E A R C H X M P L", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(X); put(M); put(P); put(L)", "interactive": true}
```

> 📘 **课外补充**：上面的代码只展示了递归的 `put`。公有的 `put` 还必须在每次插入后 **将根染黑**：`root = put(root, key, val); root->color = BLACK;`。颜色翻转可能把根的链接变为红色；将其重新染黑正是树增高的方式——恰好对应 2-3 树的根拆分。（algs4 §3.3，"Keeping the root black"）

> ⚠️ **易错点**：`h = rotateLeft(h);`——旋转会返回新子树的根，必须将其存储下来（并在结尾返回 `h`），这与 BST 的 `put` 返回其链接的方式相同。若只调用 `rotateLeft(h);`，父节点仍会指向错误的节点。

### 8.6 时间分析与字典小结

**LLRB 的高度在最坏情况下 ≤ 2 lg n**。最坏情况：最短的根到空链接路径全部由黑链接组成（全部为 2-节点，约 lg n），而最长的路径黑链接与红链接交替出现（路径上每个节点都是 3-节点），因此它至多是前者的两倍长。由于所有路径上的黑链接数量相同，任何路径都不可能超过该数量的两倍。

字典（符号表）操作小结：

| | 查找（最坏） | 插入（最坏） | 删除（最坏） | 查找（平均） | 插入（平均） | 删除（平均） |
|---|---|---|---|---|---|---|
| 顺序查找（无序列表） | n | n | n | n/2 | n | n/2 |
| 二分查找（有序数组） | log n | n | n | log n | n/2 | n/2 |
| BST | n | n | n | log n | log n | log n |
| 2-3 查找树 | c log n | c log n | c log n | c log n | c log n | c log n |
| 红黑 BST | 2 log n | 2 log n | 2 log n | 1 log n | 1 log n | 1 log n |

（此表将 BST 的平均删除列为 log n；[§6](#6-bst-小结为什么需要平衡) 指出，重复的 Hibbard 删除会使其漂移到 √n。）因此 LLRB 的查找、插入和删除在 **最坏情况下为 O(log n)**，并且在实践中路径长度约为 lg n。

### 8.7 练习

#### 哪些树是合法的 LLRB？

以下哪些是合法的 LLRB 树？将合法的 LLRB 转换为 2-3 树。（红链接标注为"red"。）

- **(i)** C；C 的左子节点 A（红），C 的右子节点 Y；Y 的左子节点 H；H 的左子节点 D（红）。
- **(ii)** E；E 的左子节点 D（红），E 的右子节点 H；D 的子节点为 C 和 F；C 的左子节点 A（红）；H 的子节点为 G 和 Z。
- **(iii)** E；子节点 B 和 Y；B 的子节点为 A 和 D；Y 的子节点为 H 和 Z（全部为黑色）。
- **(iv)** H；子节点 C 和 Y；C 的左子节点 A（红）；Y 的左子节点 T（红）。

<details>
<summary>解答</summary>

**仅 (iii) 和 (iv) 合法。**

- **(i)** **不平衡**：路径 C → A → 空只有 1 条黑链接，而 C → Y → H → D → 空有 3 条。（只有左子节点的 2-节点 Y 在 2-3 树中不可能存在。）
- **(ii)** **不满足对称序**：F 位于 D 的右子树中，因此它必须介于 D 与 E 之间，但 F > E（中序遍历为 A C D F E G H Z）。它也不平衡。
- **(iii)** 没有红链接，且每条根到空链接的路径都有 3 条黑链接 → 合法。它对应的 2-3 树形状相同：根为 [E]，其下为 [B] [Y]，再下为 [A] [D] [H] [Z]——全部为 2-节点。
- **(iv)**：两条红链接都向左倾斜，没有节点同时连接两条红链接，每条路径都有 2 条黑链接 → 合法。对应的 2-3 树：根为 [H]，子节点为 **[A C]** 和 **[T Y]**。

对照三条规则检查每棵树（切换到 2-3 视图以查看转换结果）：

```viz llrb
{"title": "合法 LLRB 检查：树 (iv)", "tree": "H, C, Y, *A, -, *T", "ops": "check()"}
```

```viz llrb
{"title": "合法 LLRB 检查：树 (i)", "tree": "C, *A, Y, -, -, H, -, -, -, -, -, *D", "ops": "check()"}
```

</details>

#### 构造 LLRB

按顺序插入以下键来构造 LLRB：**S E A R C H X M P L**，然后（单独地）**A C E H L M P R S X**。

> 提示：每次插入后，自下而上执行三项检查，然后将根染黑。

<details>
<summary>解答</summary>

**S E A R C H X M P L** —— 每次插入后的修复（自下而上）：

| 插入 | 修复 |
|---|---|
| S, E | 无（E 是 S 的红色左子节点） |
| A | 在 S 处右旋，在 E 处颜色翻转，根染黑 |
| R | 无 |
| C | 在 A 处左旋 |
| H | 在 S 处右旋，在 R 处翻转，在 E 处左旋 → R 为根，E 为其红色左子节点 |
| X | 在 S 处左旋 |
| M | 在 H 处左旋 |
| P | 在 M 处翻转（子节点 H、P）；在 E 处左旋；在 R 处右旋；再次在 M 处翻转；根染黑（高度增加） |
| L | 在 H 处左旋 |

最终结果：根为 **M**；其下为 **E** 和 **R**；E 的子节点为 **C**（带有红色左子节点 A）和 **L**（带有红色左子节点 H）；R 的子节点为 **P** 和 **X**（带有红色左子节点 S）。作为 2-3 树：[M] / [E] [R] / [A C] [H L] [P] [S X]。

**A C E H L M P R S X**（升序）：新键总是落在右侧，因此几乎每次插入都从左旋开始，而且每当右侧的链条填满时，颜色翻转就会向上传播。最终结果：根为 **H**；**C**（子节点为 A、E）和 **R**；R 的左子节点 **M** 为红色（子节点为 L、P），R 的右子节点 **X** 带有红色左子节点 **S**。作为 2-3 树：[H] / [C] [M R] / [A] [E] [L] [P] [S X]。升序输入——普通 BST 的最坏情况——在这里仍得到高度 4。

```viz llrb
{"title": "LLRB 构造检查：升序输入", "ops": "put(A); put(C); put(E); put(H); put(L); put(M); put(P); put(R); put(S); put(X)"}
```

</details>

## 9. 完整实现

### 9.1 BST

完整的 BST（字典），包含 `put`、`get`、`remove`（Hibbard 删除）、`min`、`deleteMin` 以及析构函数。练习中的各种情况在 `main` 中运行。

```cpp
#include <iostream>
#include <vector>

// ---------- BST (dictionary) ----------
template <typename Key, typename Value>
class BST {
private:
    class Node {
    public:
        Key key;            // sorted by key
        Value val;          // associated value
        Node* left, *right; // roots of left and right subtrees
        int size;           // #nodes in subtree rooted at this

        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };

    Node* root;             // root of BST

    int size(Node* x) const { return x == nullptr ? 0 : x->size; }

    Value get(Node* x, const Key& key) const {
        if (x == nullptr)
            return Value();
        if (key < x->key)
            return get(x->left, key);
        else if (key > x->key)
            return get(x->right, key);
        else
            return x->val;
    }

    Node* put(Node* x, const Key& key, const Value& val) {
        if (x == nullptr)
            return new Node(key, val, 1);
        if (key < x->key)
            x->left = put(x->left, key, val);
        else if (key > x->key)
            x->right = put(x->right, key, val);
        else
            x->val = val;
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    Node* min(Node* x) const {
        return x->left == nullptr ? x : min(x->left);
    }

    // Unlinks (does not delete) the minimum node of subtree x.
    Node* deleteMin(Node* x) {
        if (x->left == nullptr)
            return x->right;
        x->left = deleteMin(x->left);
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    Node* remove(Node* x, const Key& key) {          // Hibbard deletion
        if (x == nullptr) return nullptr;
        if (key < x->key)
            x->left = remove(x->left, key);
        else if (key > x->key)
            x->right = remove(x->right, key);
        else {
            if (x->right == nullptr) {               // cases 1 and 2
                Node* l = x->left;
                delete x;
                return l;
            }
            if (x->left == nullptr) {                // case 2
                Node* r = x->right;
                delete x;
                return r;
            }
            Node* t = x;                             // case 3
            x = min(t->right);                       // successor
            x->right = deleteMin(t->right);
            x->left = t->left;
            delete t;
        }
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    void destroy(Node* x) {
        if (x == nullptr) return;
        destroy(x->left);
        destroy(x->right);
        delete x;
    }

    void preorder(Node* x, std::ostream& out) const {
        if (x == nullptr) { out << "-"; return; }
        out << x->key;
        if (x->left == nullptr && x->right == nullptr) return;
        out << "(";
        preorder(x->left, out);
        out << " ";
        preorder(x->right, out);
        out << ")";
    }

public:
    BST() : root(nullptr) {}
    ~BST() { destroy(root); }
    BST(const BST&) = delete;
    BST& operator=(const BST&) = delete;

    int size() const { return size(root); }
    Value get(const Key& key) const { return get(root, key); }
    void put(const Key& key, const Value& val) { root = put(root, key, val); }
    void remove(const Key& key) { root = remove(root, key); }

    void print(std::ostream& out) const { preorder(root, out); out << "\n"; }
};

int main() {
    const std::vector<int> keys{8, 3, 10, 1, 6, 14, 4, 7, 13};
    BST<int, int> t;
    for (int k : keys) t.put(k, k * 10);
    t.print(std::cout);
    std::cout << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
              << ", size = " << t.size() << "\n";
    t.put(4, 3);
    t.put(9, 2);
    std::cout << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
              << ", size = " << t.size() << "\n";
    t.print(std::cout);

    for (int k : {1, 14, 6, 3, 8}) {                 // practice: each from the original
        BST<int, int> u;
        for (int x : keys) u.put(x, 0);
        u.remove(k);
        std::cout << "remove " << k << ": ";
        u.print(std::cout);
    }
    BST<int, int> h;                                 // Hibbard practice
    for (int x : {21, 10, 79, 73, 95, 70, 74, 71}) h.put(x, 0);
    h.remove(21);
    std::cout << "remove 21: ";
    h.print(std::cout);
}
```

输出（`print` 以 `key(left right)` 的形式输出树，空子树用 `-` 表示）：

```text
8(3(1 6(4 7)) 10(- 14(13 -)))
get(4) = 40, get(9) = 0, size = 9
get(4) = 3, get(9) = 2, size = 10
8(3(1 6(4 7)) 10(9 14(13 -)))
remove 1: 8(3(- 6(4 7)) 10(- 14(13 -)))
remove 14: 8(3(1 6(4 7)) 10(- 13))
remove 6: 8(3(1 7(4 -)) 10(- 14(13 -)))
remove 3: 8(4(1 6(- 7)) 10(- 14(13 -)))
remove 8: 10(3(1 6(4 7)) 14(13 -))
remove 21: 70(10 79(73(71 74) 95))
```

### 9.2 LLRB

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

输出（`*` = 来自父节点的链接为红色；高度按最长路径上的节点数计算）：

```text
in-order: *A C E *H L M P R *S X 
root M, size 10, height 4
get(H) = 5, get(Z) = 0
ascending: A C E H L *M P R *S X 
root H, height 4
```

## 10. 速查与五个要点

| | BST | 2-3 树 | LLRB |
|---|---|---|---|
| 节点 | 1 个键，2 条链接 | 1–2 个键，2–3 条链接 | 1 个键，2 条链接 + 父链接的颜色 |
| 平衡 | 无（取决于插入顺序） | 完美（所有空链接位于同一深度） | 完美的黑色平衡 |
| 高度 | 最坏为 n，随机时为 O(log n) | 介于 log₃ n 与 lg n 之间 | ≤ 2 lg n |
| 查找 / 插入（最坏） | O(n) | O(log n) | O(log n) |
| 删除 | Hibbard：叶节点、一个子节点、后继；会漂移到 √n | — | O(log n) 最坏情况（小结表） |
| 插入修复 | 无 | 自下而上拆分临时 4-节点 | rotateLeft、rotateRight、flipColors、根染黑 |

**五个要点**

1. BST 在整棵子树上满足对称序；查找和插入的代价为深度 + 1 次比较，即 O(height)：随机顺序时为 O(log n)，而对于有序输入则为 n。
2. Hibbard 删除：叶节点 → 直接删除；一个子节点 → 用该子节点替代；两个子节点 → 用后继（右子树中最左的节点）替代，并用 `deleteMin` 将其摘除；反复使用会使树失衡。
3. 2-3 树保持完美平衡，因为插入总是加入底层节点，并向上拆分临时 4-节点；只有根的拆分才会增加高度，因此高度介于 log₃ n 与 lg n 之间。
4. LLRB 把 2-3 树编码为 BST：红链接把 2-节点粘合成 3-节点，不存在连续两条红链接，红链接向左倾斜，每条路径上的黑链接数相等，因此高度 ≤ 2 lg n。
5. LLRB 的 `put`：先在底部插入红色节点，然后沿路径回溯时依次进行左旋（右红）、右旋（两条左红）、颜色翻转（两个红色子节点）——按此顺序——并将根染黑。
