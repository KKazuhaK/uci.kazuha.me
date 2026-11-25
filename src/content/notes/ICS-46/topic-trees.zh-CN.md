---
title: "树与遍历"
summary: "树的术语、深度与高度、满二叉树与完全二叉树、节点数与高度界、BinaryTree 骨架，以及层序、前序、中序和后序遍历。"
topics:
  - trees
kind: "topic"
order: 505
---

# 信息与计算机科学 46 — 话题：树与遍历

## 目录

- [1. 树：层次化数据](#1-树层次化数据)
- [2. 树的术语](#2-树的术语)
- [3. 深度、层与高度](#3-深度层与高度)
- [4. 满二叉树与完全二叉树](#4-满二叉树与完全二叉树)
- [5. 节点计数与高度界](#5-节点计数与高度界)
- [6. 骨架实现](#6-骨架实现)
- [7. 广度优先：层序遍历](#7-广度优先层序遍历)
- [8. 深度优先：前序、中序与后序](#8-深度优先前序中序与后序)
- [9. 完整实现](#9-完整实现)
- [10. 速查与五个要点](#10-速查与五个要点)

> UCI ICS 46：数据结构的实现与分析 — Tom Yeh 教授。本笔记把第 10 讲中的树与遍历内容汇集在一起，按概念组织。

## 1. 树：层次化数据

列表、栈和队列都是**线性**结构：每个元素至多有一个前驱和一个后继。**树**是一种以**层次化**方式存储元素的抽象数据类型：每个元素有**唯一一个父节点**（直接祖先）和**零个或多个子节点**（直接后代）。例子包括：组织结构图（CEO → CFO、CMO、COO、CTO → ……）、网站的站点地图（Home → About、Products，……），以及文件系统（`/` → Documents、Downloads、Music → ……）。

在计算机科学中，我们把树画成倒置的：**根**在顶部，**叶子**在底部。

**定义。** 树 $T$ 是一组节点的集合，这些节点以父子关系存储元素，且满足：

- 若 $T$ 非空，则它有一个特殊节点——**根**，根没有父节点；
- 除根以外的每个节点 $v$ 都有**唯一的父节点**。

例：根为 A；A 的子节点为 B 和 C；B 只有一个右子节点 D；C 的子节点为 E 和 F；E 有一个左子节点 G；F 的子节点为 H 和 I。逐步查看（演示获得焦点时可用 ← / → 键）：

```viz binary-tree
{"title": "第一棵树", "tree": "A, B, C, -, D, E, F, -, -, -, -, G, -, H, I", "views": "root; parent:C; ancestors:G"}
```

## 2. 树的术语

所有例子都使用同一棵**示例树**：

| 节点 | K | C | N | A | F | M | V | B | D | H | U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 左子节点 | C | A | M | — | D | — | U | — | — | — | — |
| 右子节点 | N | F | V | B | H | — | — | — | — | — | — |

| 术语 | 含义 | 示例 |
|---|---|---|
| 边 | 一对相连的节点 | (K, C) |
| 父节点 / 子节点 | 直接在上方 / 直接在下方的节点 | K 是 C 和 N 的父节点 |
| 兄弟节点 | 具有相同父节点的节点 | A 和 F |
| 祖先 / 后代 | 沿着通往根的路径，位于上方 / 下方的任意节点 | K 是 B 的祖先；B 是 K 的后代 |
| 子树 | 一个节点及其所有后代 | 以 N 为根的子树 = {N, M, V, U} |
| 叶子（外部节点） | 没有子节点 | {B, D, H, M, U} |
| 内部节点 | 至少有一个子节点 | {K, C, N, A, F, V} |
| 森林 | 一组互不相交的树 | |
| 简单路径 | 节点互不相同，且相邻两个节点之间有一条边 | K-N-V-U |
| 路径长度 | 路径上**边**的数量 | K-C-A 的长度为 2 |
| 节点的高度 | 从该节点向下到某个叶子的最长路径的长度 | height(C) = 2（C-F-D） |
| 树的高度 | 根到叶子的最长路径 = 根的高度 | 3（例如 K-C-A-B） |
| 节点的度 | 子节点的数量 | degree(C) = 2 |
| 树的度（arity） | 任一节点的度的最大值 | 2 |
| 二叉树 | 度为 2 的树：每个节点至多有 2 个子节点，分别位于**左**或**右**位置 | |

在示例树上逐个演示每个术语，每步一个：

```viz binary-tree
{"title": "示例树上的术语", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "parent:K; siblings:A; ancestors:B; subtree:N; leaves; internal; path:K-N-V-U; path:K-C-A; degree"}
```

> ⚠️ **易错点**：幻灯片的错误（即幻灯片上快速检查的答案）把叶子列为 {B, D, H, M, U, V}，内部节点列为 {K, C, N, A, F}。V 有一个子节点 U，因此 V 是**内部节点**：叶子为 {B, D, H, M, U}，内部节点为 {K, C, N, A, F, V}。

## 3. 深度、层与高度

节点的**深度（= 层）**：它到根的距离（边的数量）。根的深度/层为 0。**二叉树的深度**是其所有节点的层的最大值，且深度最大的节点一定是叶子。

**高度**则是反过来、从底部度量的：

- 叶子的高度为 0；
- 其他任一节点的高度为 1 加上其非空子节点中的最大高度。

**树的高度**就是其根的高度。因此深度从根向下计数，高度从叶子向上计数；对整棵树而言，二者一致（最大深度 = 根的高度）。

例：在一棵 10 节点的树中，叶子标为 0，它们的父节点标为 1 和 2，根标为 3；最深的叶子位于深度 3，因此树的深度 = 树的高度 = 3。在 [§2](#2-树的术语) 的示例树中：depth(F) = 2，height(F) = 1，height(K) = 3。

在示例树上同时标出深度（从根向下数）和高度（从叶子向上数）。上文提到的 10 节点树中有一个节点有三个子节点，因此它不是二叉树，所以这里的演示使用示例树：

```viz binary-tree
{"title": "深度与高度", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "depth; height"}
```

> ⚠️ **易错点**：深度和高度按**边**计算，而不是按节点计算。单节点树的高度为 0；在递归公式中，空树的高度记为 −1，这样叶子的高度就是 1 + max(−1, −1) = 0（见 [§9](#9-完整实现) 中的 `height()`）。

## 4. 满二叉树与完全二叉树

### 4.1 定义

- **满二叉树（full / proper）**：每个节点都有 **0 或 2** 个子节点——不能恰好只有一个。
- **完全二叉树（complete）**：高度最小——除最后一层外每一层都是满的，且最后一层的节点**尽可能靠左**（层序中没有空洞）。

这两个性质相互独立（一棵树可以是其中之一、两者都是，或两者都不是）：

| | 满 | 不满 |
|---|---|---|
| **完全** | 每层都满，或最后一层从左侧成对紧凑排列 | 最后一层以一个孤立的左子节点结束 |
| **不完全** | 较高层缺少某个叶子，或最后一层有空隙，但没有只有一个子节点的节点 | 例如某节点只有一个子节点**且**存在空隙 |

下面是四种形状，然后是示例树——检查*满*时，只有一个子节点的节点标为紫色；检查*完全*时，层序中的空位以虚线槽显示：

```viz binary-tree
{"title": "完全与满", "tree": "Neither complete nor full = A, B, C, D, E, F, G, H, -, -, -, I, J | Complete but not full = A, B, C, D, E, F, G, H | Full but not complete = A, B, C, D, E, F, G, H, I, -, -, J, K | Complete and full = A, B, C, D, E, F, G, H, I | Example tree = K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "full; complete"}
```

[§2](#2-树的术语) 中的示例树**两者都不是**：A 和 V 各只有一个子节点（不满），而且它的最后一层在 A 的左子节点应在的位置有一个空洞（不完全）。

### 4.2 练习

#### 满还是完全？

**(a)** 根有两个子节点；左子节点有两个子节点（叶子）；右子节点只有一个子节点，位于其左侧。这棵树属于 A：满，B：完全，C：既满又完全，D：既不满也不完全？

**(b)** 根只有一个子节点，位于其**右侧**。选项相同。

<details>
<summary>解答</summary>

**(a) B：完全。** 第 0 层和第 1 层都是满的，最后一层（三个叶子）从左侧紧凑排列。不满：根的右子节点恰好只有一个子节点。

**(b) D：既不满也不完全。** 根恰好只有一个子节点（不满），而且最后一层唯一的节点位于右侧，使左侧留下一个空洞（不完全）。如果根唯一的子节点位于**左侧**，那么它就是完全的。

```viz binary-tree
{"title": "练习验证：(a) 与 (b)", "tree": "(a) = A, B, C, D, E, F | (b) = A, -, B", "views": "full; complete"}
```

</details>

## 5. 节点计数与高度界

**引理。** 二叉树第 $k$ 层最多有 $2^k$ 个节点（每一层最多翻倍）。示例树的第 2 层达到最大值 $2^2 = 4$：A、F、M、V。

**定理。** 高度为 $h$、含 $n$ 个节点的二叉树满足

$$h + 1 \le n \le 2^{h+1} - 1 \qquad\Longleftrightarrow\qquad \log_2(n+1) - 1 \le h \le n - 1$$

- **最小值** $n = h + 1$：一根“棍子”——除叶子外每个节点都只有一个子节点，树退化为链表。因此**最坏情况下的高度为 $n - 1 = O(n)$**。
- **最大值** $n = 1 + 2 + 4 + \dots + 2^h = 2^{h+1} - 1$：每层都满。因此**最好情况下的高度为 $O(\log n)$**，由紧凑的（完全）树达到。

例：7 个节点的树，高度可以在 2（三层全满）到 6（棍子）之间取任意值。

```viz binary-tree
{"title": "同为 h = 2 时节点数最多与最少", "tree": "h = 2, most nodes (7) = A, B, C, D, E, F, G | h = 2, fewest nodes (3, a stick) = A, B, -, C", "views": "depth"}
```

> 💡 **关键洞见**：每个沿着一条根到叶子的路径执行的树操作，代价都是 O(height)——介于 O(log n) 与 O(n) 之间。让树保持较矮，正是平衡树（[查找树](topic-search-trees.zh-CN.md)）和[堆](topic-heaps.zh-CN.md)要解决的问题。

> ⚠️ **易错点**：幻灯片的错误（即幻灯片上的标注）：上界被标为 “MAX (complete)”，但 $2^{h+1} - 1$ 个节点需要**每一层**都满（即*完美*树）；高度为 $h$ 的完全树，其节点数可以在 $2^h$ 到 $2^{h+1} - 1$ 之间。

## 6. 骨架实现

与链表一样，二叉树是由通过指针相连的 `Node` 对象组成的集合，但每个节点有**两个**链接：

```cpp
template <typename Item>
class BinaryTree {
private:
    // Nested Node class
    class Node {
    public:
        Item item;      // Payload
        Node* left;     // Pointer to left child
        Node* right;    // Pointer to right child

        // Node constructor
        Node(Node* leftNode, Node* rightNode, const Item& value)
            : item(value), left(leftNode), right(rightNode) {}
    };

    Node* root; // Pointer to the root node of the tree
};
```

图中标出了各个部分：`root` 指向顶部节点；每个 `left`/`right` 指针都是一个**链接**；任一节点连同其下方的全部内容构成一棵**子树**（因此每个链接都指向一棵子树——这正是树的代码天然是递归的原因）；**叶子**是两个链接都是**空链接**（`nullptr`）的节点。

```viz binary-tree
{"title": "根、子树与空链接", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "root; subtree:C; nulls"}
```

例：一棵 3 节点的树写作 `new Node(new Node(nullptr, nullptr, "A"), new Node(nullptr, nullptr, "C"), "B")`——注意构造函数**先**接收子节点，最后接收值。

## 7. 广度优先：层序遍历

线性结构只有一种自然顺序；树则可以按多种顺序遍历：

- **广度优先**：层序；
- **深度优先**：前序、中序、后序（见 [§8](#8-深度优先前序中序与后序)）。

**层序**：从第 0 层开始，先从左到右访问第 $i$ 层的所有节点，然后才访问第 $i + 1$ 层的任何节点。在示例树上的顺序为：**K C N A F M V B D H U**。

幻灯片只给出顺序，没有代码；标准实现（我的版本）使用 FIFO 队列（见 [线性数据结构](topic-linear.zh-CN.md)）：弹出一个节点，访问它，再把它的子节点入队。

```cpp
void levelorder() const {
    std::queue<Node*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        Node* t = q.front(); q.pop();
        visit(t->item);
        if (t->left)  q.push(t->left);
        if (t->right) q.push(t->right);
    }
}
```

下面可以逐步演示（演示获得焦点时，← / → 键可用）：

```viz tree-traversal
{"title": "示例树的层序遍历", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "order": "level", "interactive": true}
```

每个节点进入和离开队列各一次，因此遍历的复杂度为 O(n)。

> ⚠️ **易错点**：幻灯片的错误（层序幻灯片上的注释）：它写道层序“为二叉搜索树提供有序顺序”。那指的是**中序**（见 [§8](#8-深度优先前序中序与后序)）；二叉搜索树的层序遍历并不有序。

## 8. 深度优先：前序、中序与后序

### 8.1 三种顺序

三种遍历都会访问根，并递归地先遍历左子树、再遍历右子树。前缀表示根**何时**被访问：**前序（pre）**= 在两棵子树之前；**中序（in）**= 在两者之间；**后序（post）**= 在两棵子树之后。

| 遍历 | 递归 | 示例树 | 典型用途（幻灯片） |
|---|---|---|---|
| 前序 | 根，Preorder(左)，Preorder(右) | K C A B F D H N M V U | 先处理父节点再处理子节点，例如**复制**一棵树 |
| 中序 | Inorder(左)，根，Inorder(右) | A B C D F H K M N U V | 在二叉搜索树上得到**有序序列**（例如查找第 k 小的元素） |
| 后序 | Postorder(左)，Postorder(右)，根 | B A D H F C M U V N K | 先处理两棵子树再处理父节点，例如**删除** |

下面是代码（我的版本——幻灯片只用文字描述递归过程），只有 `visit` 的位置发生变化：

```cpp
void preorder(Node* t) {
    if (t == nullptr) return;
    visit(t->item);          // root first
    preorder(t->left);
    preorder(t->right);
}
// inorder:   inorder(t->left);  visit(t->item);  inorder(t->right);
// postorder: postorder(t->left); postorder(t->right); visit(t->item);
```

逐步演示中序遍历（调用栈以橙色显示）：

```viz tree-traversal
{"title": "示例树的中序遍历", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "order": "in", "interactive": true}
```

每个节点恰好调用一次（另加每个空链接一次调用），因此每种遍历的时间复杂度为 O(n)；调用栈每层保存一个栈帧，额外空间为 O(height)。

> 💡 **关键洞见**：手工检查的快速方法：前序中**根排在第一位**，后序中**根排在最后**，中序中根把左子树的节点与右子树的节点**分隔**开（A B C D F H | K | M N U V）。

### 8.2 练习

#### 按四种顺序列出节点


按前序、中序、后序和层序列出节点：

| 节点 | 8 | 5 | 4 | 9 | 7 | 11 | 1 | 12 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|
| 左子节点 | 5 | 9 | — | — | 1 | 3 | — | 2 | — | — |
| 右子节点 | 4 | 7 | 11 | — | 12 | — | — | — | — | — |

（根为 8；5 的子节点为 9 和 7；7 的子节点为 1 和 12；12 有一个左子节点 2；4 只有一个右子节点 11；11 有一个左子节点 3。）

> 提示：4 没有左子节点，11 没有右子节点——递归走到它们时，缺失的一侧会立即返回。

<details>
<summary>解答</summary>

| 顺序 | 序列 |
|---|---|
| 前序 | 8 5 9 7 1 12 2 4 11 3 |
| 中序 | 9 5 1 7 2 12 8 4 3 11 |
| 后序 | 9 1 2 12 7 5 3 11 4 8 |
| 层序 | 8 5 4 9 7 11 1 12 3 2 |

检验：前序以根 8 开始，后序以它结束；中序把 8 放在左子树（9 5 1 7 2 12）与右子树（4 3 11）之间。在中序中，4 排在 3 和 11 **之前**，因为它没有左子树；在层序中，3（第 3 层，位于 11 之下）排在 1 和 12 **之后**，而 2 排在最后（第 4 层）。用下面的演示检查这里的后序：

```viz tree-traversal
{"title": "后序检验", "tree": "8, 5, 4, 9, 7, -, 11, -, -, 1, 12, -, -, 3, -, -, -, -, -, -, -, 2", "order": "post"}
```

</details>

## 9. 完整实现

本讲程序中树的部分（`build` 按从 1 开始的层序位置读取一棵树，`-` 表示空）：

```cpp
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

template <typename Item>
class BinaryTree {
private:
    class Node {
    public:
        Item item;
        Node* left;
        Node* right;
        Node(Node* leftNode, Node* rightNode, const Item& value)
            : item(value), left(leftNode), right(rightNode) {}
    };
    Node* root;

    // pos[1] = root, children of p at 2p, 2p+1, "-" = empty
    static Node* build(const std::vector<std::string>& pos, size_t p) {
        if (p >= pos.size() || pos[p] == "-") return nullptr;
        return new Node(build(pos, 2 * p), build(pos, 2 * p + 1), pos[p]);
    }
    static void destroy(Node* t) {          // post-order
        if (t == nullptr) return;
        destroy(t->left);
        destroy(t->right);
        delete t;
    }
    static void preorder(Node* t) {
        if (t == nullptr) return;
        std::cout << t->item << ' ';
        preorder(t->left);
        preorder(t->right);
    }
    static void inorder(Node* t) {
        if (t == nullptr) return;
        inorder(t->left);
        std::cout << t->item << ' ';
        inorder(t->right);
    }
    static void postorder(Node* t) {
        if (t == nullptr) return;
        postorder(t->left);
        postorder(t->right);
        std::cout << t->item << ' ';
    }
    static int height(Node* t) {             // empty = -1, leaf = 0
        if (t == nullptr) return -1;
        return 1 + std::max(height(t->left), height(t->right));
    }
    static int size(Node* t) {
        return t == nullptr ? 0 : 1 + size(t->left) + size(t->right);
    }

public:
    explicit BinaryTree(const std::vector<std::string>& pos) : root(build(pos, 1)) {}
    ~BinaryTree() { destroy(root); }
    BinaryTree(const BinaryTree&) = delete;
    BinaryTree& operator=(const BinaryTree&) = delete;

    void preorder() const { preorder(root); std::cout << '\n'; }
    void inorder() const { inorder(root); std::cout << '\n'; }
    void postorder() const { postorder(root); std::cout << '\n'; }
    void levelorder() const {
        std::queue<Node*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            Node* t = q.front(); q.pop();
            std::cout << t->item << ' ';
            if (t->left)  q.push(t->left);
            if (t->right) q.push(t->right);
        }
        std::cout << '\n';
    }
    int height() const { return height(root); }
    int size() const { return size(root); }
};

int main() {
    BinaryTree<std::string> t({"", "K", "C", "N", "A", "F", "M", "V",
                               "-", "B", "D", "H", "-", "-", "U"});
    std::cout << "pre:   "; t.preorder();
    std::cout << "in:    "; t.inorder();
    std::cout << "post:  "; t.postorder();
    std::cout << "level: "; t.levelorder();
    std::cout << "size " << t.size() << ", height " << t.height() << '\n';
}
```

输出（`g++ -std=c++17 -Wall -fsanitize=address,undefined`）：

```text
pre:   K C A B F D H N M V U
in:    A B C D F H K M N U V
post:  B A D H F C M U V N K
level: K C N A F M V B D H U
size 11, height 3
```


## 10. 速查与五个要点

| 操作 / 事实 | 代价 | 原因 |
|---|---|---|
| 前序/中序/后序/层序遍历 | O(n) | 每个节点访问一次 |
| 深度优先的额外空间 | O(height) | 每层一个调用栈帧 |
| 含 n 个节点的二叉树高度 | 在 ⌈log₂(n+1)⌉ − 1 与 n − 1 之间 | 完全树与棍子 |
| 第 k 层的最多节点数 / 高为 h 的树的最多节点数 | 2^k / 2^(h+1) − 1 | 每层翻倍 |

**必记的 5 个要点**

1. 深度从根向下数边（根 = 0）；高度从最深的叶子向上数边（叶子 = 0）；树的高度 = 根的高度。
2. 满 = 每个节点有 0 或 2 个子节点；完全 = 除最后一层外每层都满，且最后一层从左侧填充——二者相互独立。
3. 含 n 个节点的二叉树高度介于 log₂(n+1) − 1 与 n − 1 之间，因此沿根到叶子的操作代价为 O(log n) 到 O(n)。
4. 前序 = 根最先，中序 = 根居中，后序 = 根最后；二叉搜索树的中序遍历有序，层序遍历使用队列。
5. 每种遍历都只访问每个节点一次：时间为 O(n)；深度优先的几种顺序额外使用 O(height) 的调用栈空间。
