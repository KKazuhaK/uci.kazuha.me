# Information and Computer Science 46 — 话题：堆与优先队列

## 目录

- [1. 优先队列](#1-优先队列)
- [2. 堆有序的二叉树](#2-堆有序的二叉树)
- [3. 二叉堆：数组表示](#3-二叉堆数组表示)
- [4. 上浮与插入](#4-上浮与插入)
- [5. 下沉与删除最大值](#5-下沉与删除最大值)
- [6. 最小堆](#6-最小堆)
- [7. 建堆](#7-建堆)
- [8. 完整实现](#8-完整实现)
- [9. 速查与必记的 5 个要点](#9-速查与必记的-5-个要点)

> 本章在二叉堆之上构建优先队列：堆序、数组布局、上浮与下沉、插入与删除最大值、最小堆，以及从数组建堆的两种方法，并附有完整的 C++ 代码。本章假设读者已了解完全二叉树（参见[树](topic-trees.zh-CN.md)）以及大 O 分析（参见[分析](topic-analysis.zh-CN.md)）。第 7 节中建堆的主要应用——堆排序——将在[排序](topic-sorting.zh-CN.md)中展开。

## 1. 优先队列

### 1.1 优先队列 ADT

**优先队列**总是先服务**优先级最高的元素**，这与先进先出的队列（最早的先出）或后进先出的栈（最新的先出）不同。它有两个关键操作：

1. **删除（并返回）最大值**：取出优先级最高的元素；
2. **插入**：加入一个带有优先级的新元素。

实际应用包括操作系统（负载均衡、中断处理）、数据压缩（Huffman 编码）、人工智能（A\* 搜索）以及图搜索（Dijkstra 算法和 Prim 算法）。关键问题在于如何高效地实现优先队列。

例：依次插入 5、1、9，然后删除最大值 → 9；再插入 7，删除最大值 → 7。若是先进先出的队列，则会先返回 5，再返回 1。

### 1.2 数组实现及其权衡

两种显而易见的实现都把键存放在数组中：

| 实现 | 插入 | 删除最大值 | 思路 |
|---|---|---|---|
| 无序数组（“惰性”） | O(1) | O(n) | 直接追加；删除时扫描整个数组找最大值 |
| 有序数组（“急切”） | O(n) | O(1) | 保持有序，使最大值位于末尾；插入时需要移动元素 |
| 二叉堆（“最优平衡”） | O(log n) | O(log n) | 树结构使两种操作都是对数时间 |

数组在 O(1) 与 O(n) 之间只能做极端的取舍。**二叉堆**把两种操作都降到对数时间，这正是它成为优先队列 ADT 标准选择的原因：若每种操作各执行 m 次，数组的最坏代价为 O(mn)，而堆则为 O(m log n)。本章其余部分构造这个堆；它的代价在 [§5.3](#53-堆操作的运行时间) 中推导。

> 📘 **延伸阅读**：最佳选择取决于操作的组合。插入极多而删除最大值很少时，无序数组更好（插入为 O(1)）。查找最大值很频繁而更新很少时，有序数组更好（最大值总在末尾）。两种操作都频繁时，堆是首选。（algs4 §2.4 练习）

## 2. 堆有序的二叉树

**定义。** 若二叉树中每个节点的键 **大于或等于其两个子节点的键**（若存在子节点），则称该树是**堆有序**的。等价地，每个节点的键小于或等于其父节点的键。由此可得：

- **对子节点无假设**：并不规定左子节点与右子节点谁更小。
- 从任一节点**向上**走，得到的键序列是**非递减**的；**向下**走，得到的则是非递增的。
- 因此**最大的键位于根节点**。

这就是**最大堆**。把每个比较反过来，便得到**最小堆**（父节点 ≤ 子节点，最小的键位于根；见[第 6 节](#6-最小堆)）。示例如下：

| | 根 | 第 1 层 | 第 2 层 | 第 3 层 |
|---|---|---|---|---|
| 最大堆 | 100 | 19, 28 | 17, 3（位于 19 之下）· 25, 1（位于 28 之下） | 2, 7（位于 17 之下） |
| 最小堆 | 1 | 3, 2 | 7, 19（位于 3 之下）· 25, 28（位于 2 之下） | 17, 100（位于 7 之下） |

堆序只约束每一对父子节点，而不约束不同路径上的节点：在上面的最大堆中，第 2 层的 3 小于第 3 层的 7，这并无问题，因为 7 挂在 17 之下，而不在 3 之下。

> 📘 **延伸阅读**：在一个含 n 个键的堆中，大约一半（⌈n/2⌉）的节点是叶子，而且**最大堆的最小值可以是其中任何一个**，因此找到它需要 O(n)。堆只在每条根到叶的路径上是“有序”的。（algs4 §2.4 网上练习）

## 3. 二叉堆：数组表示

**二叉堆**是以**层序**存放在数组中的堆有序**完全**二叉树（完全树的定义见[树](topic-trees.zh-CN.md)）：

- 下标 0 处不存放任何元素；根位于下标 1；
- 其余节点按层、从左到右依次排列；
- 由于树是完全的，没有空洞，因此**不浪费空间**，也**不需要指针**（基于指针的树每个节点要用三个指针：父节点、左子节点和右子节点）。

**下标计算（从 1 开始）：** 对下标为 $k$ 的节点

$$\text{parent} = \lfloor k/2 \rfloor, \qquad \text{children} = 2k \text{ and } 2k + 1$$

沿树向上或向下移动，只是对下标做算术运算。直接按下标访问远比沿指针访问快，这与 ArrayList 相对于链表的优势相同。

例：最大堆 100 / 19, 36 / 17, 3, 25, 1 / 2, 7，下文的示例均复用这个堆：

| 下标 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| pq[i] | – | 100 | 19 | 36 | 17 | 3 | 25 | 1 | 2 | 7 |

验证：17 位于下标 4，其父节点为 ⌊4/2⌋ = 2（即 19），子节点为下标 8 和 9（即 2 和 7）。字母堆为 `– T S R P N O A E I H G`（根为 T；其下为 S、R；再下为 P、N、O、A；最底层为 E、I、H、G）。

> 📘 **延伸阅读**：按**降序**排列的数组总是合法的最大堆：每个父节点的下标 k 都小于其子节点的下标 2k 和 2k+1，因此它的键至少与子节点的键一样大。（algs4 §2.4 练习）

本章所有代码都位于一个类模板 `MaxPQ` 中。它用 `size_t` 表示下标，用 `n` 表示键的个数，并把堆保存在 `pq[1..n]` 中。对最大堆而言 `Compare` 为 `std::less`；[第 6 节](#6-最小堆)会将其翻转。两个私有辅助函数完成所有的比较与移动（与[排序](topic-sorting.zh-CN.md)中的 `less` 和 `exch` 相同）：

```cpp
template <typename Key, typename Compare = std::less<Key>>
class MaxPQ {
private:
  std::vector<Key> pq;     // pq[0] unused; keys at pq[1..n]
  size_t n = 0;            // number of keys in the heap
  Compare cmp;

  bool less(size_t i, size_t j) const { return cmp(pq[i], pq[j]); }
  void exch(size_t i, size_t j) { std::swap(pq[i], pq[j]); }
  // ...
```

[第 8 节](#8-完整实现)的完整代码还统计了交换次数，以便示例报告这些次数。

## 4. 上浮与插入

### 4.1 上浮（swim）

**场景：** 某个键变得**大于其父节点**，破坏了堆序。**修复：** 与其父节点交换，并重复此过程，直到恢复堆序（它遇到一个更大的父节点，或到达根）。这也称为*自底向上重新堆化（reheapify bottom-up）*。

```cpp
  void swim(size_t k) {
    while (k > 1 && less(k/2, k)) {
      exch(k, k/2);
      k = k/2;
    }
  }
```

`less(i, j)` 比较 `pq[i]` 与 `pq[j]`，`exch(i, j)` 交换二者。例：在 `– S P R G T O A E I H G` 中，下标 5 处的键变为 T；T 先与 P（下标 2）交换，再与 S（下标 1）交换：

```viz binary-heap
{"title": "上浮 swim(5)", "heap": "S, P, R, G, T, O, A, E, I, H, G", "ops": "swim(5)"}
```

结果为 `– T S R G P O A E I H G`。每次迭代上升一层，因此上浮为 O(log n)（即完全树的高度）。

> 📘 **延伸阅读**：为什么一次交换不会破坏*下方*的堆序：交换之后，上浮的键大于它原来的父节点（这正是它上浮的原因），因此它也大于原父节点的另一个子节点。唯一可能的新违例出现在再上一层的父节点处，而循环恰好检查的就是这一点。（algs4 §2.4）

### 4.2 堆插入

**插入：** 把新键**加到最底层的末尾**（即下一个空闲的数组位置，这样能保持树的完全性），然后将它**上浮**。数组满时按倍增方式扩容。

```cpp
  void insert(const Key& x) {
    if (n + 1 == pq.size()) pq.resize(2 * pq.size());   // grow by doubling
    pq[++n] = x;
    swim(n);
  }
```

**代价：** 至多 $\log n + 1$ 次比较，即路径上每层一次，因此为 **O(log n)**。

例：将 S 插入 `– T P R N H O A E I G`。S 落在下标 11（即 H 的子节点）处；S > H → 交换；S > P → 交换；S < T → 停止。结果为 `– T S R N P O A E I G H`。

```viz binary-heap
{"title": "插入 insert(S)", "heap": "T, P, R, N, H, O, A, E, I, G", "ops": "insert(S)", "interactive": true}
```

再看一例：在最大堆 `– 100 19 36 17 3 25 1 2 7` 中插入 47，它落在下标 10（即 3 的子节点）处。47 > 3 → 交换；47 > 19 → 交换；47 < 100 → 停止。数组为 `– 100 47 36 17 19 25 1 2 7 3`。

> ⚠️ **易错点**：`pq[++n]` 是**前置**自增：n 先变为新的大小，然后键放入 `pq[n]`。若写成 `pq[n++] = x`，键会放入旧的 `pq[n]`，从而**覆盖最后一个键**，因为堆存放在 `pq[1..n]` 中（下标 0 不使用）。

### 4.3 练习

#### 堆插入

在最大堆 `– 100 19 36 17 3 25 1 2 7` 中插入 47。

- **任务 1：** 展示插入的每一步。
- **任务 2：** 给出结果二叉堆的数组表示。
- **任务 3：** 插入的最坏情况时间复杂度是多少？

> 提示：新键放入下标 10，它是哪个节点的子节点？

<details>
<summary>解答</summary>

**任务 1：** 47 放入 `pq[10]`，它是下标 5（键为 3）的**左**子节点，因为 2·5 = 10。上浮：47 > 3 → 交换（47 此时位于下标 5）；47 > 19 → 交换（47 此时位于下标 2）；47 < 100 → 停止。

**任务 2：** `– 100 47 36 17 19 25 1 2 7 3`

**任务 3：** O(log n)：沿通往根的路径，每层至多一次交换（≤ log n + 1 次比较）。

```viz binary-heap
{"title": "验证：insert(47)", "heap": "100, 19, 36, 17, 3, 25, 1, 2, 7", "ops": "insert(47)"}
```

[第 8 节](#8-完整实现)中的程序会打印出相同的数组。

</details>

## 5. 下沉与删除最大值

### 5.1 下沉（sink）

**场景：** 某个键变得**小于其一个（或两个）子节点**。**修复：** 与其**较大的**子节点交换，并重复此过程，直到恢复堆序（两个子节点都已小于它，或它到达底部）。

```cpp
  void sink(size_t k) {
    while (2*k <= n) {
      size_t j = 2*k;
      if (j < n && less(j, j+1)) j++;      // j = the larger child
      if (!less(k, j)) break;
      exch(k, j);
      k = j;
    }
  }
```

逐行解释：`2*k <= n` 表示 k 仍有左子节点；`j = 2*k` 从左子节点开始；`j < n && less(j, j+1)` 若右子节点存在且更大，则移动到右子节点；`!less(k, j)` 表示 k 不小于其较大的子节点，因此已完成；否则交换，并从 j 继续。

例：在 `– T H R P S O A E I N G` 中，下标 2 处的键 H 小于其子节点 P 和 S。H 先与 S（下标 5）交换，再与 N（下标 10）交换，并在底部停止。结果为 `– T S R P N O A E I H G`。

```viz binary-heap
{"title": "下沉 sink(2)", "heap": "T, H, R, P, S, O, A, E, I, N, G", "ops": "sink(2)"}
```

下沉同样只沿一条根到叶的路径进行：O(log n)，每层**两次比较**（先选出较大的子节点，再与之比较）。

> ⚠️ **易错点**：应与**较大**的子节点交换，而不是左子节点。若 H 与 P 交换而不是与 S 交换，P 就会跑到 S 之上，这将产生新的违例。

### 5.2 删除最大值

**删除最大值：** 交换根与末尾的节点，将其从堆中移除（并返回），然后对新的根执行**下沉**。

```cpp
  Key delMax() {
    if (n == 0) throw std::out_of_range("delMax on an empty heap");
    Key max = pq[1];
    exch(1, n--);
    sink(1);
    return max;
  }
```

`exch(1, n--)` 先交换 `pq[1]` 与 `pq[n]`，*然后*才将 n 减一，因此旧的最大值位于堆末尾之后，不再属于堆。`n == 0` 的检查很重要：`n` 为无符号数，对 0 做自减会回绕成一个极大的值。

**代价：至多 2 log n 次比较。** 为什么是 2 log n 而不是 log n？下沉每层需要**两次比较**：一次选出较大的子节点（`less(j, j+1)`），另一次将键与该子节点比较（`less(k, j)`），并且至多经过 log n 层。上浮（插入）每层只需一次比较，因为每个节点只有一个父节点：至多 log n + 1 次。

例：对 `– T S R N P O A E I G H` 执行删除最大值。T 与 H 交换，T 离开堆，然后 H 下沉：H < S → 交换；H < P → 交换；H > G → 停止。结果为 `– S P R N H O A E I G`。

```viz binary-heap
{"title": "对 T S R N P O A E I G H 执行 delMax()", "heap": "T, S, R, N, P, O, A, E, I, G, H", "ops": "delMax()", "interactive": true}
```

> ⚠️ **易错点**：执行 `exch(1, n--)` 之后，新的根是原来的*最后一个键*，它通常是最小的几个键之一，因此几乎总会下沉到相当深的位置。不要从下标 n 下沉，也不要从根上浮；delMax 只调用 `sink(1)`。

### 5.3 堆操作的运行时间

| 操作 | 最坏情况 | 原因 |
|---|---|---|
| 插入 | O(log n) | 追加 + 沿一条叶到根的路径上浮 |
| 删除最大值 | O(log n) | exch + 沿一条根到叶的路径下沉（≤ 2 log n 次比较） |
| 查找最大值 | O(1) | 即 `pq[1]` |
| 空间 | O(n) | 每个键占一个数组位置（另加未使用的 `pq[0]`） |

algs4 *2.4 Binary Heap Demo* 以动画演示了字母堆上的插入与删除最大值。

> 📘 **延伸阅读**：若数组大小固定，log n 界即为最坏情况。若数组像 ArrayList 那样在插入时倍增（删除时收缩），界就变为**均摊** O(log n)：偶尔一次插入还要付出 O(n) 的复制代价。（algs4 §2.4，实践中的考虑）

### 5.4 练习

以下练习均从最大堆 `– 100 19 36 17 3 25 1 2 7` 出发（见[第 3 节](#3-二叉堆数组表示)）。

#### 堆下沉

将 7 下沉到此数组中的适当位置。在该数组中，只有下标 2 处的键 7 破坏了堆序：`– 19 7 36 17 3 25 1 2`。

- **任务 1：** 展示下沉的每一步。
- **任务 2：** 给出结果二叉堆的数组表示。
- **任务 3：** 下沉的最坏情况时间复杂度是多少？

<details>
<summary>解答</summary>

**任务 1：** 7 的子节点是 17（下标 4）和 3（下标 5）；较大的是 17，且 7 < 17 → 交换（7 此时位于下标 4）。它唯一的子节点是 2（下标 8）；7 > 2 → 停止。

**任务 2：** `– 19 17 36 7 3 25 1 2`

**任务 3：** O(log n)：每次交换下降一层，每层两次比较（≤ 2 log n 次比较）。

```viz binary-heap
{"title": "验证：sink(2)", "heap": "19, 7, 36, 17, 3, 25, 1, 2", "ops": "sink(2)"}
```

</details>

#### 删除最大值

从上面的最大堆出发：

- **第 1 部分：** 调用一次删除最大值，并展示堆的状态。
- **第 2 部分：** 删除最大值的最坏情况时间复杂度是多少？
- **第 3 部分：** 对原始的堆连续调用 9 次删除最大值，并展示数组中的值。

> 提示：交换之后，下沉总是朝*较大*的子节点方向进行。

<details>
<summary>解答</summary>

**第 1 部分：** 将 100 与最后一个键 7 交换，并移除 100。下沉 7：其子节点为 19 和 36 → 与 36 交换（7 位于下标 3）；其子节点为 25 和 1 → 与 25 交换（7 位于下标 6）；下标 6 处无子节点 → 停止。堆为 `– 36 19 25 17 3 7 1 2`，返回 100。

**第 2 部分：** O(log n)：沿一条根到叶的路径，至多 2 log n 次比较。

**第 3 部分：** 九次调用依次返回 `100 36 25 19 17 7 3 2 1`（降序）。由于每次调用都把被移除的最大值停放在缩小的堆之后，数组本身最终变为 `– 1 2 3 7 17 19 25 36 100`，即升序排列（这正是堆排序的思想，见[第 7.5 节](#75-从堆到堆排序)）。

每次调用后的数组（`|` 标出堆的末尾；其右侧的键已被移除，并由 `exch(1, n--)` 停放在那里）：

| 调用 | 返回 | `pq[1..9]` |
|---|---|---|
| 1 | 100 | 36 19 25 17 3 7 1 2 \| 100 |
| 2 | 36 | 25 19 7 17 3 2 1 \| 36 100 |
| 3 | 25 | 19 17 7 1 3 2 \| 25 36 100 |
| 4 | 19 | 17 3 7 1 2 \| 19 25 36 100 |
| 5 | 17 | 7 3 2 1 \| 17 19 25 36 100 |
| 6 | 7 | 3 1 2 \| 7 17 19 25 36 100 |
| 7 | 3 | 2 1 \| 3 7 17 19 25 36 100 |
| 8 | 2 | 1 \| 2 3 7 17 19 25 36 100 |
| 9 | 1 | \| 1 2 3 7 17 19 25 36 100 |

下面的演示不把被移除的键停放在图中，而是直接丢弃，因此最终是一个空堆；表格展示的是原地数组。

```viz binary-heap
{"title": "九次 delMax() 调用", "heap": "100, 19, 36, 17, 3, 25, 1, 2, 7", "ops": "delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax()"}
```

</details>

## 6. 最小堆

### 6.1 翻转顺序

**最小堆**使每个键 **≤** 其子节点，因此最小的键位于根。它就是最大堆的代码，把每个比较都反过来（`less(a, b)` 变为“a 大于 b”），而删除最大值则变为 **delMin**：交换根与最后一个键，将其移除，然后把新的根向*较小*的子节点下沉。在 `MaxPQ` 类中，这只是换了一个不同的 `Compare`：

```cpp
template <typename Key>
class MinPQ : public MaxPQ<Key, std::greater<Key>> {
public:
  using MaxPQ<Key, std::greater<Key>>::MaxPQ;
  Key delMin() { return this->delMax(); }
};
```

“最小优先”（最短距离、最早截止时间）的优先队列就是最小堆；Dijkstra 算法使用的正是它。在最小堆上依次执行 12 个操作（插入 P、Q、E，删除最小值，插入 X、A、M，删除最小值，插入 P、L、E，删除最小值），返回 **E、A、E**，并留下 `– L P M Q P X`。可在下方逐步演示（演示获得焦点时，← / → 键可用）：

```viz binary-heap
{"title": "最小堆上的优先队列", "ops": "insert(P); insert(Q); insert(E); delMin(); insert(X); insert(A); insert(M); delMin(); insert(P); insert(L); insert(E); delMin()", "order": "min", "interactive": true}
```

> ⚠️ **易错点**：允许重复的键。第 9 步中，插入第二个 P 时堆里已经有一个 P；`less` 是严格比较，因此相等的键一遇到相等的父节点就停止上浮，从不与之交换。

### 6.2 练习

#### 最小堆上的优先队列

在基于最小堆的优先队列上执行以下操作，并在每一步结束时画出（或按层序写出）堆的内容：

| | | | |
|---|---|---|---|
| 1. 插入 P | 4. 删除最小值 | 7. 插入 M | 10. 插入 L |
| 2. 插入 Q | 5. 插入 X | 8. 删除最小值 | 11. 插入 E |
| 3. 插入 E | 6. 插入 A | 9. 插入 P | 12. 删除最小值 |

> 提示：在最小堆中，键只要比父节点*小*，就会上浮。

<details>
<summary>解答</summary>

每一步之后、按层序排列的堆数组：

| 步骤 | 操作 | 返回 | 堆 |
|---|---|---|---|
| 1 | 插入 P | | P |
| 2 | 插入 Q | | P Q |
| 3 | 插入 E | | E Q P |
| 4 | 删除最小值 | E | P Q |
| 5 | 插入 X | | P Q X |
| 6 | 插入 A | | A P X Q |
| 7 | 插入 M | | A M X Q P |
| 8 | 删除最小值 | A | M P X Q |
| 9 | 插入 P | | M P X Q P |
| 10 | 插入 L | | L P M Q P X |
| 11 | 插入 E | | E P L Q P X M |
| 12 | 删除最小值 | E | L P M Q P X |

关键步骤：第 6 步，A 从下标 4 出发，越过 Q 和 P 上浮到根；第 10 步，L 越过 X 和 M 上浮到根；第 12 步，最后一个键 M 移到根并下沉到下标 3。[§6.1](#61-翻转顺序) 中的演示逐步展示了全部十二个操作。

</details>

## 7. 建堆

要把任意数组 `a[1..n]` 变成最大堆，有**两种方法**。它们很容易混淆，因为两者最终得到的都是堆。二者的区别在于方向、所用的操作（上浮还是下沉）以及代价。两种方法都在数组 `[2, 9, 7, 6, 5, 8]`（n = 6）上演示。在 `MaxPQ` 类中，它们分别是 `buildNaive()` 和 `buildBottomUp()`，作用于由 `MaxPQ(keys)` 载入的数组；该构造函数按给定顺序接收键，不建立任何次序。

### 7.1 方法 A：朴素（自顶向下），逐个插入键

堆**从左侧逐步增长**。起初只有 `a[1]` 是堆；每一步让下一个键加入堆的末尾，并在它大于父节点时将其**上浮**。这相当于原地执行 n 次 `insert`（向空堆插入不会移动任何元素，因此循环从 k = 2 开始）：

```cpp
  void buildNaive() {                       // n inserts, in place
    for (size_t k = 2; k <= n; k++) swim(k);   // pq[1..k-1] is already a heap
  }
```

| 步骤 | 新键 | 上浮 | 之后的堆 |
|---|---|---|---|
| k = 1 | 2 | —（单独一个） | 2 |
| k = 2 | 9 | 9 > 2 → 交换 | 9 2 |
| k = 3 | 7 | 7 < 9 → 不动 | 9 2 7 |
| k = 4 | 6 | 6 > 2 → 交换；6 < 9 → 停止 | 9 6 7 2 |
| k = 5 | 5 | 5 < 6 → 不动 | 9 6 7 2 5 |
| k = 6 | 8 | 8 > 7 → 交换；8 < 9 → 停止 | 9 6 8 2 5 7 |

演示将每一步写成 `insert(x)`，它与追加加上浮的操作完全相同：

```viz binary-heap
{"title": "方法 A：逐个插入 2, 9, 7, 6, 5, 8", "ops": "insert(2); insert(9); insert(7); insert(6); insert(5); insert(8)"}
```

**代价：** 第 k 个键至多上浮 log k 层。最坏情况下（输入递增：每个新键都是新的最大值，并一路上浮到根），代价为 log 1 + log 2 + … + log n = **O(n log n)**。

### 7.2 方法 B：最优（自底向上），从 n/2 下沉到 1

把整个数组**原样**看作一棵完全二叉树（它本来就是按层序排列的完全二叉树）：

1. 将数组视为一棵完全二叉树；
2. **忽略所有叶子**（下标 n/2 + 1，…，n），因为单个节点本身已经是堆；
3. 对其余每个节点执行下沉，**从右到左**，从最后一个内部节点一直到根：

```cpp
  void buildBottomUp() {                    // sink every internal node, right to left
    for (size_t k = n/2; k >= 1; k--) sink(k);
  }
```

**关键洞见：** `sink(k)` 完成后，以 k 为根的子树就是堆。从右到左下沉意味着处理 k 时，它的两个子节点都已是堆，因此一次下沉即可修复整棵子树；`sink(1)` 完成后，整个数组就是堆。

**为什么从 n/2 开始？** 节点 k 有左子节点，恰好当 2k ≤ n 时，即 k ≤ n/2。最后一个节点 n 的父节点为 ⌊n/2⌋，因此 ⌊n/2⌋ 是最后一个有子节点的节点；比它大的下标都是叶子。当 n = 11 时循环从 k = 5 开始；当 n = 6 时从 k = 3 开始。

对 `S O R T E X A M P L E`（n = 11）的追踪：

| 步骤 | 调用 | 移动的内容 | 之后的数组 |
|---|---|---|---|
| a) | 开始（任意顺序） | — | S O R T E X A M P L E |
| b) | sink(5) | E 与其较大的子节点 L 交换 | S O R T L X A M P E E |
| c) | sink(4) | T ≥ M、P：不动 | S O R T L X A M P E E |
| d) | sink(3) | R 与 X 交换 | S O X T L R A M P E E |
| e) | sink(2) | O 先与 T 交换，再与 P 交换 | S T X P L R A M O E E |
| f) | sink(1) | S 与 X 交换，停在 R 和 A 之上 | X T S P L R A M O E E |

```viz binary-heap
{"title": "自底向上建堆", "heap": "S, O, R, T, E, X, A, M, P, L, E", "ops": "heapify()", "interactive": true}
```

对 `[2, 9, 7, 6, 5, 8]` 做同样的操作（n = 6，因此循环从 k = 6/2 = 3 开始）：

| 步骤 | 调用 | 移动的内容 | 之后的数组 |
|---|---|---|---|
| 开始 | （任意顺序） | — | 2 9 7 6 5 8 |
| k = 3 | sink(3) | 7 < 其唯一的子节点 8 → 交换 | 2 9 8 6 5 7 |
| k = 2 | sink(2) | 9 ≥ 6 且 ≥ 5 → 不动 | 2 9 8 6 5 7 |
| k = 1 | sink(1) | 2 先与 9 交换，再与 6 交换 | 9 6 8 2 5 7 |

可在下方逐步演示。代码面板会跟随 `for` 循环及其调用的 `sink`（演示获得焦点时，← / → 键可用；跳过按钮 ⏭ 会跳到下一个 k）：

```viz binary-heap
{"title": "方法 B：对 [2, 9, 7, 6, 5, 8] 自底向上建堆", "heap": "2, 9, 7, 6, 5, 8", "ops": "heapify()", "interactive": true}
```

**代价：** **O(n)**：大多数节点位于底部附近，只能下沉很短的距离；[第 7.4 节](#74-为什么自底向上建堆是-on)对此进行了求和。

> ⚠️ **易错点**：循环变量是 `size_t`，与 `n` 的类型一致。这样做之所以安全，只因为循环在 `k >= 1` 时停止：若 `size_t` 循环一直递减到 `k >= 0`，它将永远不会结束，因为 `0 - 1` 会回绕而不是变为负数。

### 7.3 两种方法对比

| | A：朴素（自顶向下） | B：自底向上 |
|---|---|---|
| 思路 | n 次插入：堆从左侧逐个键增长 | 原地修复整个数组，从最后一个内部节点回到根 |
| 循环 | `for k = 2 … n: swim(k)` | `for k = n/2 … 1: sink(k)` |
| 键的移动方向 | **向上**（上浮，朝根） | **向下**（下沉，朝叶子） |
| 叶子 | 每个键都要上浮，叶子也不例外 | 跳过叶子（它们本身已经是堆） |
| 最坏情况 | O(n log n) | **O(n)** |
| 在 `[2, 9, 7, 6, 5, 8]` 上 | 9 6 8 2 5 7（3 次交换） | 9 6 8 2 5 7（3 次交换） |
| 在 `[1, 2, 3, 4, 5, 6, 7]` 上 | 7 4 6 1 3 2 5（10 次交换） | 7 5 6 4 2 1 3（4 次交换） |
| 典型用途 | 键随时间陆续到达的优先队列 | 堆排序的第一阶段（所有键一开始就已给出） |

在第一个数组上，两种方法恰好得到相同的堆。一般而言则不然（见最后一行）：两个结果都是合法的堆，只是不同的堆。因此，若题目要求的是“自底向上”的结果，就必须用方法 B 作答。交换次数由[第 8 节](#8-完整实现)中的程序统计。

> ⚠️ **易错点**：方法 B 的循环从右到左运行（从 n/2 到 1）。若从左到右，就会出错：处理 k 时，其子节点的子树必须已经是堆。

> ⚠️ **易错点**：不要混淆两种操作。构造 A **上浮**（每个新键向上移动）；构造 B **下沉**（每个内部节点向下移动）。把键从 n/2 递减到 1 逐个上浮，既不是这两种方法之一，也建不出堆。

### 7.4 为什么自底向上建堆是 O(n)

下沉一个节点的代价至多为它的**高度**（到叶子的距离），而大多数节点都位于底部附近。按层计数（高度 0 = 叶子）：

| 高度 h | 高度为 h 的节点数 | 最大下沉代价 | 每层的工作量 |
|---|---|---|---|
| 0（叶子） | 约 n/2 | 0 | 0 |
| 1 | 约 n/4 | 1 | (n/4) · 1 |
| 2 | 约 n/8 | 2 | (n/8) · 2 |
| … | … | … | … |
| h | 约 n / 2^(h+1)（根处为 1） | h（根处为 log n） | (n / 2^(h+1)) · h |

总工作量 = n/2 · 0 + n/4 · 1 + n/8 · 2 + … + 1 · log n = n (0/2 + 1/4 + 2/8 + 3/16 + …) ≤ n · 1 = **O(n)**。

**错位相减法**说明该级数至多为 1。设 S = 1/4 + 2/8 + 3/16 + 4/32 + …，则 S/2 = 1/8 + 2/16 + 3/32 + …。逐项相减：

S − S/2 = 1/4 + 1/8 + 1/16 + … = 1/2（等比级数），因此 S = 1。

作比较：朴素构造逐个插入键，后期的插入可能上浮 log n 层，因此为 **O(n log n)**。自底向上方法更快，因为真正可能移动很远的少数节点（靠近根的那些）才是被下沉的对象，而数量众多的叶子则不产生任何代价。

> 💡 **关键洞见**：朴素插入要为*众多*底层节点付出 log n；自底向上下沉只为*一个*顶层节点付出 log n。

### 7.5 从堆到堆排序

堆排序由第一阶段（自底向上建堆，方法 B）加第二阶段（**sortdown**：反复把最大值移到末尾）组成。两个阶段调用的是**同一个 `sink`**，只是参数不同：第一阶段对**每个内部节点 k** 以**完整的 n** 执行下沉；第二阶段总是对**根 1** 执行下沉，而 n 每轮减一，这正是[第 5.4 节](#54-练习)中九次调用的例子里被移除的键被停放的做法。为了对任意数组（而不只是优先队列自身的存储）排序，`sink` 以数组及其大小作为参数。sortdown、完整的 `heapSort` 代码、其分析以及与其他排序算法的比较，见[排序](topic-sorting.zh-CN.md)。

### 7.6 练习

#### 建堆

**第 1 部分。** 对数组 `[2, 9, 7, 6, 5, 8]` 执行建堆，展示每一步。

**第 2 部分。** 朴素建堆（逐个插入元素）的最坏情况时间复杂度是多少？

**第 3 部分。** 优化后（自底向上）建堆的最坏情况时间复杂度是多少？

> 提示：n = 6，因此第一次调用是 `sink(3)`。

<details>
<summary>解答</summary>

**第 1 部分：** `sink(3)`：7 < 8 → 交换 → `2 9 8 6 5 7`；`sink(2)`：9 大于 6 和 5 → 不动；`sink(1)`：2 < 9 → 交换，然后 2 < 6 → 交换 → **`9 6 8 2 5 7`**（共 3 次交换）。

**第 2 部分：** **O(n log n)**：n 次插入，每次 O(log n)。

**第 3 部分：** **O(n)**：大多数节点位于底部附近，只下沉很短的距离；该级数 n · Σ h/2^(h+1) ≤ n。见[第 7.2 节](#72-方法-b最优自底向上从-n2-下沉到-1)和[第 7.4 节](#74-为什么自底向上建堆是-on)。

</details>

## 8. 完整实现

一个类模板 `MaxPQ` 包含本章的全部内容：保存在 `pq[1..n]` 中的堆、`swim` 与 `sink`、`insert` 与 `delMax`（数组满时倍增扩容）、两种建堆方法，以及一个交换计数器。`MinPQ` 由它派生而来，并翻转了比较方式。`swim` 与 `sink` 为公有成员，以便示例能够修复单个被破坏的键；正式的优先队列实现应将它们设为私有。`print(total)` 输出 `pq[1..n]`，若 `total > n`，还会在其后输出一个 `|` 以及被 `delMax` 停放在堆之后的键。`main` 重放了本章的每个示例与练习题。

```cpp
#include <cstddef>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

// Binary heap priority queue. The heap lives in pq[1..n]; pq[0] is unused.
// With the default Compare = std::less the top key is the maximum (max-heap);
// with std::greater it is the minimum (min-heap).
template <typename Key, typename Compare = std::less<Key>>
class MaxPQ {
private:
  std::vector<Key> pq;     // pq[0] unused; keys at pq[1..n]
  size_t n = 0;            // number of keys in the heap
  size_t moves = 0;        // number of exchanges so far (for counting)
  Compare cmp;

  bool less(size_t i, size_t j) const { return cmp(pq[i], pq[j]); }
  void exch(size_t i, size_t j) { std::swap(pq[i], pq[j]); ++moves; }

public:
  explicit MaxPQ(size_t capacity = 8) : pq(capacity + 1) {}

  // Takes the keys exactly as given, in level order. No heap order is
  // established; call buildNaive() or buildBottomUp() for that.
  explicit MaxPQ(const std::vector<Key>& keys) : pq(keys.size() + 1), n(keys.size()) {
    for (size_t i = 0; i < n; i++) pq[i + 1] = keys[i];
  }

  bool isEmpty() const { return n == 0; }
  size_t size() const { return n; }
  size_t exchanges() const { return moves; }
  const Key& max() const { return pq[1]; }

  void swim(size_t k) {
    while (k > 1 && less(k/2, k)) {
      exch(k, k/2);
      k = k/2;
    }
  }

  void sink(size_t k) {
    while (2*k <= n) {
      size_t j = 2*k;
      if (j < n && less(j, j+1)) j++;      // j = the larger child
      if (!less(k, j)) break;
      exch(k, j);
      k = j;
    }
  }

  void insert(const Key& x) {
    if (n + 1 == pq.size()) pq.resize(2 * pq.size());   // grow by doubling
    pq[++n] = x;
    swim(n);
  }

  Key delMax() {
    if (n == 0) throw std::out_of_range("delMax on an empty heap");
    Key max = pq[1];
    exch(1, n--);
    sink(1);
    return max;
  }

  void buildNaive() {                       // n inserts, in place
    for (size_t k = 2; k <= n; k++) swim(k);
  }

  void buildBottomUp() {                    // sink every internal node, right to left
    for (size_t k = n/2; k >= 1; k--) sink(k);
  }

  // Prints pq[1..n]; with total > n also prints the keys parked after the heap.
  void print(size_t total = 0) const {
    for (size_t i = 1; i <= n; i++) std::cout << pq[i] << ' ';
    if (total > n) {
      std::cout << '|';
      for (size_t i = n + 1; i <= total; i++) std::cout << ' ' << pq[i];
    }
    std::cout << '\n';
  }
};

// Min-oriented priority queue: the same heap with the comparison flipped.
template <typename Key>
class MinPQ : public MaxPQ<Key, std::greater<Key>> {
public:
  using MaxPQ<Key, std::greater<Key>>::MaxPQ;
  Key delMin() { return this->delMax(); }
};

int main() {
  // The priority queue ADT
  MaxPQ<int> pqa;
  pqa.insert(5); pqa.insert(1); pqa.insert(9);
  std::cout << "delMax -> " << pqa.delMax() << '\n';
  pqa.insert(7);
  std::cout << "delMax -> " << pqa.delMax() << '\n';

  // swim and insert
  MaxPQ<char> sw(std::vector<char>{'S','P','R','G','T','O','A','E','I','H','G'});
  sw.swim(5);
  std::cout << "swim(5): "; sw.print();

  MaxPQ<char> L(std::vector<char>{'T','P','R','N','H','O','A','E','I','G'});
  L.insert('S');
  std::cout << "insert S: "; L.print();

  std::vector<int> h = {100, 19, 36, 17, 3, 25, 1, 2, 7};
  MaxPQ<int> a(h);
  a.insert(47);
  std::cout << "insert 47: "; a.print();

  // sink and delMax
  MaxPQ<char> s2(std::vector<char>{'T','H','R','P','S','O','A','E','I','N','G'});
  s2.sink(2);
  std::cout << "sink(2): "; s2.print();

  MaxPQ<int> b(std::vector<int>{19, 7, 36, 17, 3, 25, 1, 2});
  b.sink(2);
  std::cout << "sink 7: "; b.print();

  MaxPQ<char> dm(std::vector<char>{'T','S','R','N','P','O','A','E','I','G','H'});
  char top = dm.delMax();
  std::cout << "delMax -> " << top << ": "; dm.print(11);

  MaxPQ<int> c(h);
  std::cout << "delMax -> " << c.delMax() << ": "; c.print();

  MaxPQ<int> d(h);
  std::cout << "nine delMax calls (| marks the end of the heap):\n";
  for (size_t call = 1; call <= 9; call++) {
    int r = d.delMax();
    std::cout << "  " << call << ". returns " << r << " : ";
    d.print(9);
  }

  // min-heap
  MinPQ<char> m;
  std::cout << "min-heap operations:\n";
  std::string ops[] = {"P","Q","E","-","X","A","M","-","P","L","E","-"};
  int step = 1;
  for (const std::string& op : ops) {
    std::cout << "  " << step++ << ". ";
    if (op == "-") std::cout << "delMin -> " << m.delMin() << " | ";
    else { m.insert(op[0]); std::cout << "insert " << op << " | "; }
    m.print();
  }

  // construction
  std::vector<int> arr = {2, 9, 7, 6, 5, 8};
  MaxPQ<int> na(arr), bu(arr);
  na.buildNaive();
  bu.buildBottomUp();
  std::cout << "[2 9 7 6 5 8] naive:     "; na.print();
  std::cout << "               (exchanges: " << na.exchanges() << ")\n";
  std::cout << "[2 9 7 6 5 8] bottom-up: "; bu.print();
  std::cout << "               (exchanges: " << bu.exchanges() << ")\n";

  std::vector<int> seven = {1, 2, 3, 4, 5, 6, 7};
  MaxPQ<int> na7(seven), bu7(seven);
  na7.buildNaive();
  bu7.buildBottomUp();
  std::cout << "[1..7] naive:     "; na7.print();
  std::cout << "       (exchanges: " << na7.exchanges() << ")\n";
  std::cout << "[1..7] bottom-up: "; bu7.print();
  std::cout << "       (exchanges: " << bu7.exchanges() << ")\n";

  MaxPQ<char> cs(std::vector<char>{'S','O','R','T','E','X','A','M','P','L','E'});
  std::cout << "bottom-up construction trace:\n  start: "; cs.print();
  for (size_t k = cs.size()/2; k >= 1; k--) {
    cs.sink(k);
    std::cout << "  sink(" << k << "): ";
    cs.print();
  }
}
```

输出：

```text
delMax -> 9
delMax -> 7
swim(5): T S R G P O A E I H G 
insert S: T S R N P O A E I G H 
insert 47: 100 47 36 17 19 25 1 2 7 3 
sink(2): T S R P N O A E I H G 
sink 7: 19 17 36 7 3 25 1 2 
delMax -> T: S P R N H O A E I G | T
delMax -> 100: 36 19 25 17 3 7 1 2 
nine delMax calls (| marks the end of the heap):
  1. returns 100 : 36 19 25 17 3 7 1 2 | 100
  2. returns 36 : 25 19 7 17 3 2 1 | 36 100
  3. returns 25 : 19 17 7 1 3 2 | 25 36 100
  4. returns 19 : 17 3 7 1 2 | 19 25 36 100
  5. returns 17 : 7 3 2 1 | 17 19 25 36 100
  6. returns 7 : 3 1 2 | 7 17 19 25 36 100
  7. returns 3 : 2 1 | 3 7 17 19 25 36 100
  8. returns 2 : 1 | 2 3 7 17 19 25 36 100
  9. returns 1 : | 1 2 3 7 17 19 25 36 100
min-heap operations:
  1. insert P | P 
  2. insert Q | P Q 
  3. insert E | E Q P 
  4. delMin -> E | P Q 
  5. insert X | P Q X 
  6. insert A | A P X Q 
  7. insert M | A M X Q P 
  8. delMin -> A | M P X Q 
  9. insert P | M P X Q P 
  10. insert L | L P M Q P X 
  11. insert E | E P L Q P X M 
  12. delMin -> E | L P M Q P X 
[2 9 7 6 5 8] naive:     9 6 8 2 5 7 
               (exchanges: 3)
[2 9 7 6 5 8] bottom-up: 9 6 8 2 5 7 
               (exchanges: 3)
[1..7] naive:     7 4 6 1 3 2 5 
       (exchanges: 10)
[1..7] bottom-up: 7 5 6 4 2 1 3 
       (exchanges: 4)
bottom-up construction trace:
  start: S O R T E X A M P L E 
  sink(5): S O R T L X A M P E E 
  sink(4): S O R T L X A M P E E 
  sink(3): S O X T L R A M P E E 
  sink(2): S T X P L R A M O E E 
  sink(1): X T S P L R A M O E E 
```

输出与上文的追踪一致：`swim(5)`、插入、`sink(2)` 与删除最大值调用之后的数组相同（`|` 之后停放的键即为已排序的尾部），最小堆的第 1–12 步相同，建堆的追踪也相同，其中交换次数 3/3 与 10/4 同[第 7.3 节](#73-两种方法对比)一致。

## 9. 速查与必记的 5 个要点

| 操作（二叉堆，n 个键） | 最坏情况 | 比较次数 |
|---|---|---|
| 插入（追加 + 上浮） | O(log n) | ≤ log n + 1 |
| 删除最大值 / 删除最小值（exch + 下沉） | O(log n) | ≤ 2 log n |
| 查找最大值 / 最小值 | O(1) | 0 |
| 朴素建堆（n 次插入） | O(n log n) | 对每个键上浮 |
| 自底向上建堆 | O(n) | 对每个 k 从 n/2 递减到 1 下沉 |
| 空间 | O(n) | |

| 优先队列的实现方式 | 插入 | 删除最大值 |
|---|---|---|
| 无序数组 | O(1) | O(n) |
| 有序数组 | O(n) | O(1) |
| 二叉堆 | O(log n) | O(log n) |

**必记的 5 个要点**

1. 最大堆是存放在 `pq[1..n]` 中的堆有序完全二叉树：父节点为 ⌊k/2⌋，子节点为 2k 和 2k+1，最大值位于根。
2. 插入 = 把键放在 `pq[++n]` 并上浮（每层一次比较）；删除最大值 = 先执行 `exch(1, n--)`，再执行 `sink(1)`（每层两次比较，且总是朝较大的子节点方向）。
3. 两种操作都是 O(log n)，因为它们只沿一条根到叶的路径进行；查找最大值为 O(1)。
4. 优先队列总是先服务最优先的元素；无序或有序数组会使其中一种操作为 O(n)，而二叉堆使两种操作都为 O(log n)。最小堆就是把比较方式翻转后的同一份代码。
5. 自底向上建堆（对 k = n/2 … 1 从右到左下沉）只需 O(n)；n 次朴素插入（上浮）需要 O(n log n)，并且可能得到不同的堆。