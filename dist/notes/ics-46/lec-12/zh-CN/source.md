# Information and Computer Science 46 — Lecture 12：堆排序、二叉搜索树

## 目录

- [1. 建堆：朴素与自底向上](#1-建堆朴素与自底向上)
- [2. 为什么自底向上建堆是 O(n)](#2-为什么自底向上建堆是-on)
- [3. 下沉排序（sortdown）](#3-下沉排序sortdown)
- [4. 堆排序分析与排序总结](#4-堆排序分析与排序总结)
- [5. 二叉搜索树（BST）](#5-二叉搜索树bst)
- [6. Node 类](#6-node-类)
- [7. 查找](#7-查找)
- [8. 插入](#8-插入)
- [9. 树的形状与运行时间](#9-树的形状与运行时间)
- [10. Hibbard 删除](#10-hibbard-删除)
- [11. BST 小结：删除使树变得不平衡](#11-bst-小结删除使树变得不平衡)
- [12. 完整实现](#12-完整实现)
- [13. 课堂活动（附解答）](#13-课堂活动附解答)
- [14. 速查与必记的 5 个要点](#14-速查与必记的-5-个要点)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026, 11/05/26（标题页仍写着 11/03/26）
> 整理自 Lecture 12 幻灯片（其中重复了 Lecture 11 幻灯片末尾的堆排序与 BST 幻灯片；堆与 BST 的对比幻灯片取自 Lecture 11 幻灯片）；补充材料：algs4 §2.4 Priority Queues（堆排序）与 §3.2 Binary Search Trees。按概念组织，而不是按资料来源组织。

> 📅 **课程安排**：Quiz 4 周五 11/6（Sorting、Trees、Heaps）· 期中考试周四 11/12 · 期中考试之前没有 HW 或 Lab
> 期中考试范围：模板、随机性、指针、引用、智能指针、多维数据；算法分析、ArrayList、链表、循环数组；栈、队列、双端队列；均摊分析、递归分析；基于比较的排序
> 期中复习：样题（待提供）、测验、课堂活动、作业、实验——实验中的实现也在考试范围内
> 使用 AI 工具需要提交两部分同意书（存储的数据不用于学术诚信问题；研究同意可获 1% 额外学分，另会提供替代的额外学分方式）

---

## 1. 建堆：朴素与自底向上

堆排序的第一阶段把任意数组 `a[1..n]` 变为最大堆。有两种做法：

- **朴素（自顶向下）：** 逐个插入键——每次插入都是追加加上上浮，O(log n)。n 次插入 → **O(n log n)**。
- **优化（自底向上）：** 把数组看作完全二叉树，跳过叶子，从 `k = n/2` 到 `k = 1` 逐个下沉每个内部节点（已在 [第 11 讲](lec-11.zh-CN.md#8-最优自底向上建堆) 中介绍）：

```cpp
for (int k = n/2; k >= 1; k--)
    sink(a, k, n);
```

幻灯片 6 对 `[2, 9, 7, 6, 5, 8]` 的标准答案（n = 6，所以循环从 k = 6/2 = 3 开始）：

| 步骤 | 调用 | 移动的内容 | 之后的数组 |
|---|---|---|---|
| 开始 | （任意顺序） | — | 2 9 7 6 5 8 |
| k = 3 | sink(3, 6) | 7 小于它唯一的子节点 8 → 交换 | 2 9 8 6 5 7 |
| k = 2 | sink(2, 6) | 9 ≥ 6 且 ≥ 5 → 不移动 | 2 9 8 6 5 7 |
| k = 1 | sink(1, 6) | 2 与 9 交换，再与 6 交换 | 9 6 8 2 5 7 |

在下方逐步演示（演示获得焦点时，← / → 键可用）：

```viz binary-heap
{"title": "幻灯片 6：对 [2, 9, 7, 6, 5, 8] 自底向上建堆", "heap": "2, 9, 7, 6, 5, 8", "ops": "sink(3); sink(2); sink(1)", "interactive": true}
```

> ⚠️ **易错点**：循环从**右到左**运行（n/2 递减到 1）。从左到右则会出错：下沉 k 时，它的子树必须已经是堆。

> 📝 **练习**：[活动：建堆](#131-活动建堆幻灯片-5)——手工运行，然后说出朴素与优化两种方法的最坏情况。

## 2. 为什么自底向上建堆是 O(n)

下沉一个节点的代价至多是它的**高度**（到叶子的距离），而大多数节点都靠近底部。按层计数（高度 0 为叶子）：

| 高度 h | 高度为 h 的节点数 | 最大下沉代价 | 每层工作量 |
|---|---|---|---|
| 0（叶子） | ~ n/2 | 0 | 0 |
| 1 | ~ n/4 | 1 | (n/4) · 1 |
| 2 | ~ n/8 | 2 | (n/8) · 2 |
| … | … | … | … |
| h | ~ n / 2^(h+1)（根为 1） | h（根处为 log n） | (n / 2^(h+1)) · h |

总工作量 = n/2 · 0 + n/4 · 1 + n/8 · 2 + … + 1 · log n = n (0/2 + 1/4 + 2/8 + 3/16 + …) ≤ n · 1 = **O(n)**。

**移位法**（幻灯片的提示）说明该级数至多为 1。令 S = 1/4 + 2/8 + 3/16 + 4/32 + …，则 S/2 = 1/8 + 2/16 + 3/32 + …。逐项相减：

S − S/2 = 1/4 + 1/8 + 1/16 + … = 1/2（等比数列），所以 S = 1。

作为对比：朴素建堆逐个插入键，后期插入的键可能上浮 log n 层，因此为 **O(n log n)**。自底向上更快，因为真正可能移动很远的少数节点（靠近根部）才会被下沉，而数量众多的叶子没有代价。

> 💡 **关键洞见**：朴素插入为大量位于底层的节点付出 log n；自底向上的下沉只为位于顶部的那一个节点付出 log n。

## 3. 下沉排序（sortdown）

第二阶段：反复删除最大值，但**把它留在数组中**，而不是置空。`exch(a, 1, n--)` 把最大值与堆的最后一个位置交换，并缩小堆，因此该位置已在堆之外，保存着它的最终值。

```cpp
while (n > 1) {
    exch(a, 1, n--);
    sink(a, 1, n);
}
```

**关键洞见（幻灯片）：** 每次迭代之后，数组是一个**堆有序的子数组，后面紧跟一个按最终顺序排好的子数组**。升序输出来自**最大**堆，因为每次取出的最大值都放在末尾。

幻灯片 9 用 algs4 的例子追踪下沉排序（由 `S O R T E X A M P L E` 构成的堆，即 `X T S P L R A M O E E`）：`exch(1, 11), sink(1, 10)`、`exch(1, 10), sink(1, 9)`，……一直到 `exch(1, 2), sink(1, 1)`，最终得到 `A E E L M O P R S T X`。幻灯片 10 链接了 algs4 *2.4 Heapsort Demo*。在下方逐步演示：

```viz binary-heap
{"title": "幻灯片 9：对 X T S P L R A M O E E 执行下沉排序", "heap": "X, T, S, P, L, R, A, M, O, E, E", "ops": "sortdown()", "interactive": true}
```

**代价：** n − 1 次迭代，每次一次交换加上一次 O(log n) 的下沉 → 最坏情况 **O(n log n)**。

> ⚠️ **易错点**：`sink(a, 1, n)` 必须使用**已经减小**的 n。若用旧的 n 下沉，会把刚放好的最大值拉回堆中。

> 📝 **练习**：[活动 1](#132-活动-1下沉排序幻灯片-11)——对 §1 的堆执行下沉排序，并说出它的最坏情况。

## 4. 堆排序分析与排序总结

堆排序 = 自底向上建堆 + 下沉排序。

| 阶段 | 交换与比较 |
|---|---|
| 建堆 | O(n) 次交换与 O(n) 次比较 |
| 下沉排序（及总计） | O(n log n) 次交换与比较 |

因此堆排序是**原地**的，并且有**保证的 O(n log n) 最坏情况**——不需要额外数组。归并排序需要 O(n) 额外空间；快速排序是原地的，但最坏情况为 O(n²)。

**渐近最优，但是……**

1. **内层循环较长：** 每次键比较的工作量比快速排序多（常数因子更大）。
2. **缓存局部性差。** *为什么？* 下沉从下标 k 跳到 2k，因此在大数组中，连续的比较访问的内存位置相距很远。快速排序和归并排序扫描相邻元素，它们能留在缓存中。
3. **不稳定：** 长距离交换不能保持相等键的原始顺序。

幻灯片 13 的排序总结：

| 排序 | 原地 | 稳定 | 最好 | 平均 | 最坏 | 备注 |
|---|---|---|---|---|---|---|
| 选择 | ✓ | | O(n²) | O(n²) | O(n²) | n 次交换 |
| 插入 | ✓ | ✓ | O(n) | O(n²) | O(n²) | 用于小数组或部分有序的数组 |
| 归并 | | ✓ | O(n log n) | O(n log n) | O(n log n) | 性能有保证；稳定 |
| 快速 | ✓ | | O(n log n) | O(n log n) | O(n²) | 以 n log n 为概率保证；最快！ |
| 堆 | ✓ | | O(n log n) | O(n log n) | O(n log n) | 性能有保证；原地 |

总结幻灯片附有完整堆排序动画的链接：https://visualgo.net/en/heap?slide=1

> 📘 **课外补充**：常数很小。algs4 表明自底向上建堆至多使用 2n 次比较和 n 次交换，而整个堆排序使用的比较与交换次数少于 2 n lg n（这也是它的平均情况）。（algs4 §2.4）

> ⚠️ **易错点**："堆排序是 O(n log n)"对**最好情况**同样成立（键互不相同）。与插入排序不同，它无法在已排序数组上提前结束：升序数组不是最大堆，而下沉排序总要执行 n − 1 次下沉。

## 5. 二叉搜索树（BST）

**二叉搜索树（BST）**是处于**对称有序**状态的二叉树：每个节点都有一个键，并且该键

- **大于**其左子树中的所有键，并且
- **小于**其右子树中的所有键。

幻灯片中的实现说明：重复键可以用不同方式处理，但**我们假设没有重复键**。可选的教材用 BST 实现**字典**，因此每个节点保存一个**键值对**；其他实现（例如集合）只保存键。

示例（幻灯片中的运行示例）：根为 S；左子树为 E，其子节点为 A 和 R；右子节点为 X。小于 E 的键（A、C）位于 E 的左链接之下，介于 E 与 S 之间的键（H、M、R）位于 E 的右链接之下。[第 10 讲](lec-10.zh-CN.md#8-深度优先前序中序与后序)中的**中序**遍历按排序顺序访问这些键：A C E H M R S X。

堆和 BST 都是二叉树，但解决的问题不同（幻灯片取自 Lecture 11 的幻灯片）：

| | 堆 | BST |
|---|---|---|
| 用于实现 | 优先队列 | 有序字典 |
| 支持的操作 | 插入、删除最大值 | 插入、查找、删除、有序操作 |
| 插入的内容 | 键 | 键值对 |
| 底层数据结构 | （可扩容的）数组 | 链式节点 |
| 树的形状 | 完全二叉树 | 取决于数据 |
| 键的排列 | 堆有序 | 对称有序 |
| 允许重复键？ | 允许 | 不允许（用于实现字典时） |

> ⚠️ **易错点**：规则针对的是**整个子树**，而不只是子节点。一棵满足"每个左子节点 < 父节点 < 右子节点"的树仍然可能出错，例如根为 8、左子节点为 3、3 的右子节点为 9：9 位于 8 的*左*子树中，却比 8 大。

## 6. Node 类

BST 使用一个内部类 `Node`，它由以下部分组成：

- 一个**键**和一个**值**（字典中的键值对）；
- **指向左子树（较小键）和右子树（较大键）根的指针**；
- 可选的**节点计数器**：以该节点为根的子树中的节点数。它能加速某些操作，例如查找第 k 小或第 k 大的键。

BST 本身只保存 `Node* root`。幻灯片 18 的代码：

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

幻灯片中的错误（这些代码无法编译；测验可能会按原样显示代码）：

- `template <template Key, …>` → `template <typename Key, typename Value>`。
- `Node* left, right;` 把 `right` 声明为 `Node`，而不是 `Node*`（`*` 只作用于紧邻的一个名字）→ 改为 `Node* left, *right;` 或分两条声明。
- `class Node` 使所有成员都是私有的，因此 `BST` 的方法无法读取 `x->key` → 使用 `struct Node` 或加上 `public:`。

修正版本见 [§12](#12-完整实现)。`put` 还需要一个 `size(Node*)` 辅助函数，在传入 `nullptr` 时返回 0；幻灯片使用了它，但没有展示。

## 7. 查找

从根开始比较：

- 如果键**小于**节点的键，走**左**子树；
- 如果键**大于**节点的键，走**右**子树；
- 如果两者**相等**，就是**查找命中**。

返回该键对应的节点指针；若没有该键，则返回 `nullptr`（有些实现返回最后到达的节点）。**比较次数 = 节点深度 + 1。**

幻灯片 21 的递归版本返回值而不是节点，未命中时返回 `Value()`：

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

幻灯片 20 的例子是 S-E-X-A-R-C-H-M 树：**查找 R**——R < S，向左；R > E，向右；R == R，命中（3 次比较；R 的深度为 2）。**查找 T**——T > S，向右；T < X，向左；该链接为空，因此未命中。在下方逐步演示两者：

```viz bst
{"title": "幻灯片 20：查找命中（R）与查找未命中（T）", "keys": "S, E, X, A, R, C, H, M", "ops": "get(R); get(T)", "interactive": true}
```

> ⚠️ **易错点**：未命中时返回 `Value()` 存在歧义——存储的值也可能恰好等于 `Value()`（例如 `int` 的 0）。这就是幻灯片的另一版本返回节点指针（`nullptr` 表示未命中）的原因。

> 📝 **练习**：[活动 2](#133-活动-2查找幻灯片-26)——查找 4 和 9。

## 8. 插入

插入沿着查找路径进行：

- 小于节点的键 → 向左；大于 → 向右；
- **如果到达空链接，就在那里插入**一个新节点；
- **如果键已存在，就更新其值**（不允许重复键）。

比较次数 = 节点深度 + 1。幻灯片 22 链接了 algs4 *3.2 Binary Search Tree Demo*。幻灯片 25 的代码：

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

每次调用都返回其（可能已改变的）子树的根，调用者再把它存回自己的链接中。只有底部的空链接会改变。在回溯的过程中，其他赋值会写回相同的指针，并重新计算 `size` 字段。

幻灯片 24 的例子是**插入 L**：L < S → 向左到 E；L > E → 向右到 R；L < R → 向左到 H；L > H → 向右到 M；L < M 且 M 的左链接为空 → 在那里创建节点。然后在回溯时重置链接并递增计数。

```viz bst
{"title": "幻灯片 24：插入 L", "keys": "S, E, X, A, R, C, H, M", "ops": "put(L)"}
```

> ⚠️ **易错点**：写成 `put(x->left, key, val);` 而不把结果赋值，会丢失新节点。只有返回的指针会被挂到树上。公共方法中的 `put(root, …)` 也是同样的道理。

> 📝 **练习**：[活动 3](#134-活动-3插入幻灯片-27)——加入 (4, 3) 和 (9, 2)。

## 9. 树的形状与运行时间

**相同的键集合**会根据插入顺序得到不同的 BST（幻灯片 28）：

- **最好情况：** 完全平衡，例如 H 在根，C 和 S 在其下，然后是 A E R X；
- **典型情况：** 略微不均衡，高度是 log n 的一个小倍数；
- **最坏情况：** 按排序顺序插入的键（A C E H R S X）会构成一条"退化链"。每个节点只有右子节点，因此高度为 n。

由于查找和插入的比较次数 = 深度 + 1，代价为 **O(height)**：

- 如果 n 个互不相同的键以**随机顺序**插入，查找和插入的期望比较次数为 **O(log n)**，期望高度为 O(log n)。
- **最坏情况高度为 n**：键必须按排序（或逆序）到达。此时查找、插入和删除都是 **O(n)**。

例：先插入 H（中位数），再插入每一半的中位数，即 H C S A E R X，得到高度为 3 的最好情况树。插入 A C E H R S X 则得到高度为 7 的树。

> 📘 **课外补充**：随机顺序的常数约为 1.39：由 n 个随机键构建的 BST 中，一次查找命中、未命中或插入平均需要约 2 ln n ≈ 1.39 lg n 次比较——仅比完全平衡的树多约 39%。任何把 H 放在最前、C 位于 A 和 E 之前、S 位于 R 和 X 之前的顺序，都会得到最好情况的树。（algs4 §3.2）

## 10. Hibbard 删除

删除是较难的操作，因为移除一个有两个子节点的节点后，会留下两棵子树，而只有一个父链接可以用来挂接它们。**Hibbard 删除**分为三种情况（幻灯片 30–32）：

1. **叶子：** 直接删除该节点（其父节点的链接变为空）。例：在树 46 / 34, 70 / 11, 44, 52（52 是 70 的左子节点）/ 6, 19 中，删除 52。
2. **一个子节点：** 删除该节点，并用它的子节点替换它。例：在同一棵树中删除 70；52 取代它的位置，成为 46 的右子节点。
3. **两个子节点：** 用它的**后继**（树中下一个更大的键）替换该节点。后继是**右子树中最小的节点**，即**右子树中最左边的节点**。后继没有左子节点。把后继的右子节点（如果有）移到后继原来的位置。例：在 50 / 29, 65 / 11, 32, 51, 91 / 52, 72, 99 中删除 50。后继是 51（先向右到 65，再向左到 51）。51 取代 50，51 的右子节点 52 成为 65 的左子节点。

这种交换保持了对称有序：后继大于左子树中的所有键，并且小于右子树中剩余的所有键，因为在被删除的键与其后继之间不存在其他键。

幻灯片只用文字描述各种情况，没有代码。以下是仿照 `put` 风格的完整版本（本讲义自撰）：

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

`min` 沿着左链接走到底；`deleteMin` 通过返回右子树来替换最小节点，从而将其摘除（两者都在 [§12](#12-完整实现) 中）。之所以命名为 `remove`，是因为 `delete` 是 C++ 关键字。逐步演示幻灯片 32 的情况 3（可尝试 `remove(11)` 对应情况 1，或 `remove(91)` 对应后继位置更深的情况 3）：

```viz bst
{"title": "幻灯片 32：情况 3，删除 50", "keys": "50, 29, 65, 11, 32, 51, 91, 52, 72, 99", "ops": "remove(50)", "interactive": true}
```

**代价：** 找到节点及其后继，都只需沿着同一条路径向下走：**O(height)**。

> ⚠️ **易错点**：在情况 3 中，应先设置 `x->right = deleteMin(t->right)`，**再**设置 `x->left = t->left`。当后继恰好是 t 自己的右子节点时（如活动 4 中删除 6），若先设置左链接，`deleteMin(t->right)` 会从后继出发，沿着它新的左链接进入原来的左子树，从而摘除错误的节点。

> 📝 **练习**：[活动 4](#135-活动-4删除幻灯片-33)（同一棵树上的三种情况）和 [活动 5](#136-活动-5hibbard-删除幻灯片-34)。

## 11. BST 小结：删除使树变得不平衡

- 随机插入得到平均 O(log n) 高度的 BST，因此查找和添加平均为 O(log n)。
- 按排序顺序插入会得到最坏情况的"退化链"，因此 BST 的查找、插入和删除的最坏情况为 **O(n)**。
- 插入与 **Hibbard 删除**混合使用时，BST 会变得**不平衡，偏向左侧**。删除总是从右子树取后继，因此右子树不断缩小（幻灯片对比了一棵满树和一棵左重的树）。

*我们能对删除造成的不对称做些什么？* **对称 Hibbard 删除：** 在后继与**前驱**（左子树中最大的键）之间交替使用，或随机选择其一。经验上它已被证明能让树高保持接近 O(log n)，但**没有形式化的证明**。

即便如此，这些方法也不能改善最坏情况：BST 的最坏操作仍然是 O(n)。

> ➡️ **接续见 [第 14 讲](lec-14.zh-CN.md)**：符号表的增长阶表（BST 的最坏情况为 n，而每个操作的目标是 log n），以及"我们如何达到目标？"——平衡 BST（2-3 树、左倾红黑树）。

## 12. 完整实现

```cpp
#include <iostream>
#include <utility>
#include <vector>

// ---------- Heap sort (1-based: a[0] unused) ----------
template <typename T>
bool less(const std::vector<T>& a, int i, int j) { return a[i] < a[j]; }

template <typename T>
void exch(std::vector<T>& a, int i, int j) { std::swap(a[i], a[j]); }

template <typename T>
void sink(std::vector<T>& a, int k, int n) {
    while (2 * k <= n) {
        int j = 2 * k;
        if (j < n && less(a, j, j + 1)) j++;
        if (!less(a, k, j)) break;
        exch(a, k, j);
        k = j;
    }
}

template <typename T>
void heapSort(std::vector<T>& a) {       // a[1..n] holds the keys
    int n = static_cast<int>(a.size()) - 1;
    for (int k = n / 2; k >= 1; k--)     // 1) heap construction
        sink(a, k, n);
    while (n > 1) {                       // 2) sortdown
        exch(a, 1, n--);
        sink(a, 1, n);
    }
}

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
    std::vector<int> a{0, 2, 9, 7, 6, 5, 8};         // a[0] unused
    int n = 6;
    for (int k = n / 2; k >= 1; k--) sink(a, k, n);
    std::cout << "heap: ";
    for (int i = 1; i <= n; i++) std::cout << a[i] << " ";
    std::cout << "\n";
    heapSort(a);
    std::cout << "sorted: ";
    for (int i = 1; i <= n; i++) std::cout << a[i] << " ";
    std::cout << "\n";

    std::vector<char> s{' ', 'S','O','R','T','E','X','A','M','P','L','E'};
    heapSort(s);
    for (std::size_t i = 1; i < s.size(); i++) std::cout << s[i];
    std::cout << "\n";

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

    for (int k : {1, 14, 6, 3, 8}) {                 // Activity 4: each from the original
        BST<int, int> u;
        for (int x : keys) u.put(x, 0);
        u.remove(k);
        std::cout << "remove " << k << ": ";
        u.print(std::cout);
    }
    BST<int, int> h;                                 // Activity 5
    for (int x : {21, 10, 79, 73, 95, 70, 74, 71}) h.put(x, 0);
    h.remove(21);
    std::cout << "remove 21: ";
    h.print(std::cout);
}
```

输出（`print` 以 `key(left right)` 的形式输出树，空子树用 `-` 表示）：

```text
heap: 9 6 8 2 5 7 
sorted: 2 5 6 7 8 9 
AEELMOPRSTX
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

## 13. 课堂活动（附解答）

每个活动都先自己尝试，再阅读解答。这些活动共用同一棵 BST：

```text
        8
      /   \
     3     10
    / \      \
   1   6      14
      / \     /
     4   7   13
```

### 13.1 活动：建堆（幻灯片 5）

**第 1 部分。** 对数组 [2,9,7,6,5,8] 执行建堆。展示每一步。

**第 2 部分。** 朴素建堆的最坏情况时间复杂度是多少？（每次插入 1 个元素）

**第 3 部分。** 优化后的建堆的最坏情况时间复杂度是多少？

> 提示：n = 6，所以第一次调用是 `sink(3, 6)`。

<details>
<summary>解答</summary>

**第 1 部分：** `sink(3, 6)`：7 < 8 → 交换 → `2 9 8 6 5 7`；`sink(2, 6)`：9 大于 6 和 5 → 不移动；`sink(1, 6)`：2 < 9 → 交换，然后 2 < 6 → 交换 → **`9 6 8 2 5 7`**（共 3 次交换）。

**第 2 部分：** **O(n log n)**——n 次插入，每次 O(log n)。

**第 3 部分：** **O(n)**——大多数节点位于底部附近，只下沉很短的距离；级数 n · Σ h/2^(h+1) ≤ n。参见 [§1](#1-建堆朴素与自底向上) 和 [§2](#2-为什么自底向上建堆是-on)。

</details>

### 13.2 活动 1：下沉排序（幻灯片 11）

给定你之前构造的堆（`9 6 8 2 5 7`），运行堆排序的第二步——下沉排序，对数组进行排序。下沉排序的最坏情况时间复杂度是多少？

<details>
<summary>解答</summary>

竖线把堆与已排序部分分开：

| 步骤 | `exch(1, n--)` 之后 | `sink(1, n)` 之后 |
|---|---|---|
| n = 6 → 5 | 7 6 8 2 5 \| 9 | 8 6 7 2 5 \| 9 |
| n = 5 → 4 | 5 6 7 2 \| 8 9 | 7 6 5 2 \| 8 9 |
| n = 4 → 3 | 2 6 5 \| 7 8 9 | 6 2 5 \| 7 8 9 |
| n = 3 → 2 | 5 2 \| 6 7 8 9 | 5 2 \| 6 7 8 9（不移动） |
| n = 2 → 1 | 2 \| 5 6 7 8 9 | 循环结束（n = 1） |

结果：**2 5 6 7 8 9**。最坏情况：**O(n log n)**——n − 1 次迭代，每次都是最多 log n 层的下沉。验证一下：

```viz binary-heap
{"title": "活动 1 检查：对 9 6 8 2 5 7 执行下沉排序", "heap": "9, 6, 8, 2, 5, 7", "ops": "sortdown()"}
```

</details>

返回 [§3](#3-下沉排序sortdown)。

### 13.3 活动 2：查找（幻灯片 26）

在上面的 BST 中查找键 4 和 9。

> 提示：数一数比较次数。

<details>
<summary>解答</summary>

**4：** 4 < 8 → 向左；4 > 3 → 向右；4 < 6 → 向左；4 == 4 → **命中**，4 次比较（深度 3 + 1）。**9：** 9 > 8 → 向右；9 < 10 → 向左；10 的左链接为空 → **未命中**（`nullptr` / `Value()`），2 次比较。

</details>

返回 [§7](#7-查找)。

### 13.4 活动 3：插入（幻灯片 27）

如何在添加键值对时保持对称有序？在上面的 BST 中加入键值对 (4,3) 和 (9,2)。（节点只显示键。）

> 提示：其中一个键已经在树中。

<details>
<summary>解答</summary>

**(4,3)：** 查找路径 8 → 3 → 6 → 4 结束于一个已有节点，因此**只更新其值**为 3；树的形状不变。**(9,2)：** 9 > 8 → 向右；9 < 10 → 向左；为空 → **新节点 9（值 2）成为 10 的左子节点**。结合活动 2 一起检查：

```viz bst
{"title": "活动 2 和活动 3 检查", "keys": "8, 3, 10, 1, 6, 14, 4, 7, 13", "ops": "get(4); get(9); put(4, 3); put(9, 2)"}
```

</details>

返回 [§8](#8-插入)。

### 13.5 活动 4：删除（幻灯片 33）

如何在删除键值对的同时保持对称有序？从上面的原始 BST 中分别删除每个节点（每次单独删除）：

- 删除 1
- 删除 14
- 删除 6
- 删除 3
- 删除 8

> 提示：在重画树之前，先说出每个节点属于哪种情况。

<details>
<summary>解答</summary>

| 删除 | 情况 | 结果（`key(left right)`，`-` = 空） |
|---|---|---|
| 1 | 叶子 | 8(3(- 6(4 7)) 10(- 14(13 -))) |
| 14 | 一个子节点 → 13 上移 | 8(3(1 6(4 7)) 10(- 13)) |
| 6 | 两个子节点；后继为 7（6 的右子节点，没有左子节点） | 8(3(1 7(4 -)) 10(- 14(13 -))) |
| 3 | 两个子节点；后继为 4 = 6 所在子树中的最小值 | 8(4(1 6(- 7)) 10(- 14(13 -))) |
| 8 | 两个子节点；后继为 10 = 右子树中的最小值（10 没有左子节点），因此 10 的右子树保持不变 | 10(3(1 6(4 7)) 14(13 -)) |

陷阱在于**删除 3**：它的后继不是其右子节点 6，而是 6 之下最左边的节点，即 4。

</details>

返回 [§10](#10-hibbard-删除)。

### 13.6 活动 5：Hibbard 删除（幻灯片 34）

按照 Hibbard 删除法，在树 21 / 10, 79 / 73, 95 / 70, 74（73 的子节点）/ 71（70 的右子节点）中删除节点 21。

<details>
<summary>解答</summary>

21 有两个子节点 → 情况 3。后继是右子树中的最小值：79 → 73 → **70**（70 没有左子节点）。70 的右子节点 **71 上移成为 73 的左子节点**，然后 70 取代 21 的位置：**70 / 10, 79 / 73, 95 / 71, 74**。检查一下：

```viz bst
{"title": "活动 5 检查：删除 21", "keys": "21, 10, 79, 73, 95, 70, 74, 71", "ops": "remove(21)"}
```

</details>

返回 [§10](#10-hibbard-删除)。

## 14. 速查与必记的 5 个要点

| 操作 | 最坏情况 | 说明 |
|---|---|---|
| 朴素建堆（n 次插入） | O(n log n) | 为每个新键上浮 |
| 自底向上建堆 | O(n) | `for k = n/2 … 1: sink(a, k, n)` |
| 下沉排序 | O(n log n) | `exch(a, 1, n--); sink(a, 1, n);` |
| 堆排序 | O(n log n)，原地，不稳定 | 最好情况同样为 n log n |
| BST 查找 / 插入 / 删除 | O(height)：最坏 O(n)，随机插入时平均 O(log n) | 比较次数 = 深度 + 1 |

| BST 删除情况 | 操作 |
|---|---|
| 叶子 | 父链接 ← 空 |
| 一个子节点 | 父链接 ← 该子节点 |
| 两个子节点 | 用后继替换 = 右子树中最左边的节点；后继的右子节点接替其原来的位置 |

**必记的 5 个要点**

1. 自底向上建堆从 n/2 下沉到 1，代价为 **O(n)**（求和 n · Σ h/2^(h+1) ≤ n）；逐个插入键则为 O(n log n)。
2. 下沉排序把最大值交换到末尾，缩小 n，然后用**新的** n 下沉；数组始终是一个堆加上一个有序的尾部。
3. 堆排序在所有情况下都是 O(n log n)，并且是原地的，但不稳定，缓存局部性差，内层循环也比快速排序长。
4. BST 的代价为 O(height)：随机插入顺序得到平均 O(log n)；有序输入得到高度为 n 的退化链，因此最坏情况为 O(n)。
5. Hibbard 删除一个有两个子节点的节点时使用后继（右子树中的最小值）；反复这样做会使树向左倾斜。对称删除在经验上有帮助，但没有证明。