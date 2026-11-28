# Information and Computer Science 46 — 话题：列表、栈与队列

## 目录

- [1. 线性结构、ADT 与数据结构](#1-线性结构adt-与数据结构)
- [2. ArrayList（动态数组）](#2-arraylist动态数组)
- [3. 扩容与均摊分析](#3-扩容与均摊分析)
- [4. 单链表](#4-单链表)
- [5. 双链表](#5-双链表)
- [6. ArrayList 与链表的比较](#6-arraylist-与链表的比较)
- [7. 栈](#7-栈)
- [8. 队列](#8-队列)
- [9. 循环数组队列](#9-循环数组队列)
- [10. 双端队列](#10-双端队列)
- [11. 栈的应用：表达式求值](#11-栈的应用表达式求值)
- [12. 队列的应用](#12-队列的应用)
- [13. 完整实现](#13-完整实现)
- [14. 速查与五个要点](#14-速查与五个要点)

> 本章从零开始构建最基本的线性结构：可扩容数组（ArrayList）、单链表与双链表、栈、队列、循环数组与双端队列，并给出它们的运行时间，以及一套风格统一的 C++ 类。阅读本章需要先掌握 C++ 类、模板、指针与动态内存（[C++ 基础](topic-cpp.zh-CN.md)），以及大 O 记号（[复杂度分析](topic-analysis.zh-CN.md)）。

## 1. 线性结构、ADT 与数据结构

### 1.1 为什么需要数据结构？

数据结构的作用是**组织并存放数据**，使我们需要的操作足够高效（可以对比一下杂乱堆放的书与分类上架的书）。衡量它的标准是**时间**与**空间**复杂度，而且**不存在放之四海而皆准的结构**，因此结构才会有这么多种。

常见操作包括**插入、删除、查找与替换**，此外还有**遍历、排序与判空**。没有哪一种结构能同时高效地完成所有操作。具体选择取决于数据本身、需要哪些操作以及它们出现的频率，也取决于内存或实时期限等技术约束。

### 1.2 线性与非线性

| 线性（一个序列，每个元素都有前驱和后继） | 非线性（层次式或相互连接） |
|---|---|
| 连续存储：数组、ArrayList（[§2](#2-arraylist动态数组)） | 树：二叉树、BST |
| 基于指针：单链表与双链表（[§4](#4-单链表)、[§5](#5-双链表)） | 图：节点与边 |
| 顺序访问：栈、队列（[§7](#7-栈)、[§8](#8-队列)） | 非连续内存，非顺序遍历 |

非线性结构的内容请参见[树](topic-trees.zh-CN.md)。

### 1.3 ADT 与数据结构

我们把集合**做什么**与**怎样实现**分开来看。

- **抽象数据类型（ADT）**回答的是*做什么*：存放哪些数据，提供哪些操作。它是一份行为契约，不涉及内存布局。
- **数据结构（DS）**回答的是*怎样做*：数据如何组织、存储与操作。它关心的是内存布局、效率，以及每个操作背后的算法。

| ADT（“做什么”） | 操作 | 实现它的数据结构（“怎样做”） |
|---|---|---|
| 列表（List） | 对有序集合执行 `add()`、`remove()`、`get()` | ArrayList（可动态扩容的数组）、链表（节点指针） |
| 栈（Stack） | LIFO：`push()`、`pop()`、`peek()` | 基于数组的栈、链式栈（单链表节点） |
| 队列（Queue） | FIFO：`enqueue()`、`dequeue()` | 循环数组（环形缓冲区）、链式队列（头尾指针） |

例如，“一个 Stack”指的是 ADT；“以头节点为栈顶的链式栈”则是它的一种数据结构实现。它的 `push` 之所以是 O(1)，是因为*结构*本身，而不是因为 ADT。

### 1.4 本章使用的类族

本章的所有代码都属于同一族类模板，它们遵循相同的约定，因此各部分可以拼在一起：

- `T` 是元素类型，`size_t n` 是元素个数，下标都是从 0 开始的 `size_t`。
- 链表节点是嵌套的 `struct Node`，成员为 `item`、`next`，双链表中还有 `prev`；链表保存 `head`、`tail` 与 `n`。以数组为底层的类保存 `data`、`cap`（已分配的长度）与 `n`。
- 非法下标抛出 `std::out_of_range`；从空栈或空队列弹出、出队时抛出 `std::underflow_error`。观察型操作（`get`、`peek`、`front`）返回元素的副本。

| 类 | ADT | 基于 |
|---|---|---|
| `ArrayList<T>`（[§2](#2-arraylist动态数组)） | List | 可扩容数组 |
| `SinglyLinkedList<T>`（[§4](#4-单链表)） | List | 带 `next` 的节点；`head` 与 `tail` |
| `DoublyLinkedList<T>`（[§5](#5-双链表)） | List | 带 `next` 与 `prev` 的节点；`head` 与 `tail` |
| `ArrayStack<T>`、`LinkedStack<T>`（[§7](#7-栈)） | Stack | `ArrayList` / `SinglyLinkedList` |
| `ArrayListQueue<T>`、`LinkedQueue<T>`（[§8](#8-队列)） | Queue | `ArrayList` / `SinglyLinkedList` |
| `CircularQueue<T>`（[§9](#9-循环数组队列)） | Queue | 循环数组 |
| `Deque<T>`（[§10](#10-双端队列)） | Deque | 循环数组 |

栈和队列只是列表外面的薄包装（适配器）：每个操作都只是对底层列表的一两次调用，因此它们的运行时间直接继承自列表。[第 13 节](#13-完整实现)完整列出了每一个类，并给出编译运行的结果。

## 2. ArrayList（动态数组）

### 2.1 状态

ArrayList（可调整大小的数组，又称动态数组）是一种**以 0 为起始下标的线性结构**，存放在**连续内存**中，底层是**某个容量的数组**。与数组一样，它支持**按下标 O(1) 访问**。它保存三样东西：数组 `data`、**大小** `n`（元素个数），以及**容量** `cap`（已分配的长度）。它自动分配与释放内存，只使用前 `n` 个单元；数组已满时，它会分配一块更大的数组，并把所有元素复制过去。它对应 `std::vector`。

下图的容量为 8，大小为 3；虚线单元已分配但尚未使用：

```viz arraylist
{"title": "容量 8，大小 3", "ops": "add(ICS46); add(ROCKS); add(!)", "capacity": 8, "start": 7, "code": "none"}
```

不变式是 **n ≤ cap**；区间 `[n, cap)` 中的单元不含有效内容。

### 2.2 API

| 分组 | 操作 | 含义 |
|---|---|---|
| 构造函数 | `ArrayList()` | 空表，**初始容量为 2** |
| | `ArrayList(size_t capacity)` | 空表，指定容量 |
| 查询 | `isEmpty()`、`size()`、`capacity()`、`get(size_t index)` | 是否为空、元素个数、已分配长度、按下标取元素 |
| 修改 | `add(const T& item)` | 追加到末尾 |
| | `add(size_t index, const T& item)` | 插入，其后的元素右移 |
| | `T remove()` | 删除并返回最后一个元素 |
| | `T remove(size_t index)` | 删除指定下标处的元素，其后的元素左移 |
| | `set(size_t index, const T& item)` | 替换指定下标处的元素 |

不带下标的 `add` 与 `remove` 作用于**末尾**，这是数组中开销最小的一端（与 `push_back` 和 `pop_back` 相同）。

### 2.3 添加与扩容

数据成员与两个构造函数（容量为 0 时会被提升为 1，否则翻倍将永远无法使容量增长）：

```cpp
template <typename T>
class ArrayList {
private:
    T* data;          // the underlying array
    size_t cap;       // allocated length
    size_t n;         // number of items

public:
    ArrayList() : ArrayList(2) {}                      // default capacity 2
    explicit ArrayList(size_t capacity)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1), n(0) {}
    // ...
```

追加时，若数组已满则先扩容，然后把元素存入下标 `n` 处：

```cpp
    void add(const T& item) {                          // append at the end
        if (n == cap) resize(2 * cap);
        data[n++] = item;
    }

    void resize(size_t newCap) {
        T* bigger = new T[newCap];
        for (size_t i = 0; i < n; ++i) bigger[i] = data[i];   // the Theta(n) copy
        delete[] data;
        data = bigger;
        cap = newCap;
    }
```

数组已满时，`add` 会分配两倍容量的新数组，复制全部 n 个元素（**即 Θ(n) 的部分**），释放旧数组，把 `data` 重新指向新数组，最后再存入元素。指针的切换正是这里要理解的重点，因此我们在此完整演示一次：对已满、容量为 2 的数组执行 `add("!")`（演示从扩容处开始）。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz arraylist
{"title": "对已满的 ArrayList 执行 add", "ops": "add(ICS46); add(Rocks); add(!)", "start": 7}
```

> ⚠️ **易错点**：先复制，再 `delete[]`，最后把 `data` 指向新数组。先删除会丢失数据；先改指针而不释放旧缓冲区则会造成内存泄漏。

由于类拥有 `data`，复制 ArrayList 时也必须复制缓冲区，否则两个列表会释放同一块数组。因此完整的类遵循三法则：析构函数执行 `delete[] data`，复制构造函数分配 `new T[other.cap]` 并复制元素，以及复制并交换的 `operator=(ArrayList other)`。

### 2.4 在下标处插入与删除

`add(index, item)` 会把 `data[index..n-1]` 整体右移一格，并且**从后往前**移动，这样在移动之前不会有元素被覆盖。`remove(index)` 则向左移动，**从前往后**进行：

```cpp
    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (n == cap) resize(2 * cap);
        for (size_t i = n; i > index; --i) data[i] = data[i - 1];   // back to front
        data[index] = item;
        ++n;
    }

    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data[index];
        for (size_t i = index; i + 1 < n; ++i) data[i] = data[i + 1];   // front to back
        --n;
        shrinkIfSparse();
        return item;
    }
```

`add(index, item)` 允许 `index == n`（即追加）；其他所有带下标的方法都要求 `index < n`，由 `rangeCheck` 强制检查，不满足时抛出 `std::out_of_range`。不带下标的 `remove()` 取出最后一个元素，即 `T item = data[--n];`，列表为空时抛出异常。两种删除最后都会调用 `shrinkIfSparse()`：

```cpp
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (cap > 1 && n <= cap / 4) resize(cap / 2);
    }
```

扩容与缩容策略将在[第 3 节](#3-扩容与均摊分析)中分析。

### 2.5 完整追踪

每一步增加一行。在阅读表格之前，先预测内容、大小与容量：

| 步骤 | 调用 | 内容 | 大小 | 容量 | 发生了什么 |
|---|---|---|---|---|---|
| 1 | `ArrayList<std::string> a1;` | — | 0 | 2 | 默认容量为 2 |
| 2 | `a1.add("ICS46");` | ICS46 | 1 | 2 | 存入下标 n 处 |
| 3 | `a1.add("Rocks");` | ICS46, Rocks | 2 | 2 | 此时已满 |
| 4 | `a1.add("!");` | ICS46, Rocks, ! | 3 | **4** | 已满 → 翻倍、复制，然后追加 |
| 5 | `a1.add(1, "Throws");` | ICS46, Throws, Rocks, ! | 4 | 4 | Rocks 与 ! 右移 |
| 6 | `a1.add(3, "?");` | ICS46, Throws, Rocks, ?, ! | 5 | **8** | 已满 → 翻倍、右移、插入 |
| 7 | `a1.remove();` | ICS46, Throws, Rocks, ? | 4 | 8 | 返回 `!` |
| 8 | `a1.remove();` | ICS46, Throws, Rocks | 3 | 8 | 返回 `?` |
| 9 | `a1.remove();` | ICS46, Throws | 2 | **4** | 返回 `Rocks`；2/8 = ¼ 满 → 容量减半 |

[第 13 节](#13-完整实现)中的编译程序会打印出上述的每一个状态；之后执行 `a1.get(5)` 会抛出 `out_of_range: index 5`。下面是完整的追踪过程，每次只移动一个元素（也可以在下方的方框中尝试自己的调用）。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz arraylist
{"title": "ArrayList 追踪", "ops": "add(ICS46); add(Rocks); add(!); add(1, Throws); add(3, ?); remove(); remove(); remove()", "interactive": true}
```

### 2.6 运行时间

| 操作 | 最坏情况 | 均摊 |
|---|---|---|
| `isEmpty`、`size`、`get`、`set` | O(1) | — |
| `add(x)`（末尾） | O(n) | **O(1)** |
| `remove()`（末尾） | O(n)（含缩容） | O(1) |
| `add(i, x)`、`remove(i)` | O(n)（移动元素） | O(n) |

ArrayList 擅长末尾操作与随机访问，不擅长头部与中间的操作。链表（[§4](#4-单链表)）则做出了相反的权衡。

### 2.7 练习

#### ArrayList 追踪：应该发生什么？

从默认容量为 2 的空 `ArrayList<std::string> a1;` 开始，依次执行 `add("ICS46")`、`add("Rocks")`、`add("!")`、`add(1, "Throws")`、`add(3, "?")`，然后执行三次 `remove()`。请预测每一步之后的内容、大小与容量。

<details>
<summary>解答</summary>

1/2 → 2/2（已满）→ `!` 触发翻倍：3/4 → "Throws" 使 Rocks 与 ! 右移：4/4 → `?` 触发翻倍到 8，并使 `!` 右移：[ICS46, Throws, Rocks, ?, !] 5/8 → 三次删除依次返回 `!`、`?`、`Rocks`；在 2/8 = ¼ 时容量减半：[ICS46, Throws] 2/4。表格见 [§2.5](#25-完整追踪)。

</details>

## 3. 扩容与均摊分析

### 3.1 策略与最坏情况

| | 扩容 | 缩容 |
|---|---|---|
| 触发条件 | 向**已满**的列表添加元素 | 列表变为 **¼ 满** |
| 动作 | 容量 × 2 | 容量 × ½ |
| 代价 | 复制全部元素 | 复制全部元素 |

**关键问题：** `add()` 的最坏情况是什么？**代价模型：** 插入计 1，复制 n 个元素计 n。因此一次 `add` 平时代价为 1，扩容时代价为 n + 1：**最坏情况 O(n)**。但对于一*串* add 而言，这样的估计过于悲观，因此需要均摊分析。

> 📘 **延伸阅读**：缩容阈值取 ¼（而不是 ½）可以避免抖动。如果在 ½ 时就缩容，那么在边界处交替执行 `add` 与 `remove` 时，每次调用都会触发 Θ(n) 的扩容或缩容。

### 3.2 均摊代价

**每次操作的均摊代价** = 一串 n 次操作的总代价 ÷ n。常用方法有：**聚合法**（界定总代价 T(n) 再除以 n，本节采用的方法）、**记账法**（为每次操作收取固定费用，并存下余额）、**势能法**（用势能函数储存“能量”）。

> 💡 **关键洞见**：均摊不等于平均情况。这里不涉及任何概率：它是对*任意*操作序列的*总代价*给出的最坏情况保证。

### 3.3 翻倍与每次增加 1

从容量 1 开始，调用 n 次 `add`。当数组已满时，第 (k+1) 次 add 需要复制 k 个元素：

| k | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |
|---|---|---|---|---|---|---|---|---|---|
| 复制代价，×2 | 0 | 1 | 2 | 0 | 4 | 0 | 8 | 0 | 16 |
| 复制代价，+1 | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |

（每一列的插入代价都是 1；总代价 = 插入 + 复制。）

观察 +1 扩容时复制代价如何不断累积，并与上表对照。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz arraylist
{"title": "每次增加 1：此后每次 add 都要复制全部元素", "ops": "add(A); add(B); add(C); add(D); add(E); add(F)", "capacity": 1, "growth": "plus1"}
```

- **翻倍：** 复制次数 $= 1 + 2 + 4 + \dots + 2^{\lfloor \log_2 n \rfloor} \le 2n$（等比，公比为 2），插入次数 $= n$，总计 $\le 3n$ → **均摊 O(1)**，但代价呈“阶跃式”：扩容次数减半，而每次扩容的代价加倍。
- **+1：** 总计 $= n + (0 + 1 + \dots + (n-1)) = n + n(n-1)/2 = \Theta(n^2)$ → **均摊 Θ(n)**。

用[第 13 节](#13-完整实现)中的程序测量（初始容量为 1；“每次 add”把插入也计算在内）：

```text
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)
```

> ⚠️ **易错点**：应当说“`add` 是**均摊** O(1)，**最坏情况** O(n)”。省略“均摊”二字是错误的。

> 📘 **延伸阅读**（Thornton）：对于总时间而言，均摊 O(1) 没有问题；但如果*每一次*操作都有期限（实时控制、60 fps 的游戏），那么一次 O(n) 的扩容就意味着错过一帧。

### 3.4 练习

#### 均摊分析：每次增加 1

如果每当数组已满时，我们只把它扩大 1 个单元，那么 ArrayList 的 `add()` 的均摊时间复杂度是多少？

<details>
<summary>解答</summary>

**每次 add 为 Θ(n)。** 每次 add 之前数组都已满，因此第 (k+1) 次 add 要复制 k 个元素：总计 $n + n(n-1)/2 = \Theta(n^2)$，再除以 n。翻倍策略的总代价 ≤ 3n，均摊 O(1)。

</details>

## 4. 单链表

### 4.1 由指针连接的节点

ArrayList 把元素保存在一整块连续内存中。**链表**同样是动态的线性结构，但每个元素位于堆上各自的**节点**中，顺序则通过节点之间的**指针**来记录，因此节点可以分布在内存的任何位置。在编号 0–7 的内存单元示意图中，列表 "CS ? !" 从单元 3（**头节点**）开始，单元 3 链接到单元 1，单元 1 链接到单元 6；其余单元不属于该列表。

递归定义：单链表**要么为空（`nullptr`），要么是一个节点，该节点保存一个元素，并指向另一条单链表**。`Node` 保存一个类型为 `T` 的元素，以及指向下一节点的链接。最后一个节点的 `next` 为 `nullptr`（通常的方框图中以斜线表示）。要访问某个节点，必须从头节点出发遍历：

```viz linked-list
{"title": "到达最后一个节点需要遍历", "items": "CS, ?, !", "ops": "get(2)", "start": 1}
```

> 📘 **延伸阅读**（algs4 §1.3）：递归定义给出了标准的遍历循环 `for (Node* x = head; x != nullptr; x = x->next)`，用于打印、析构与复制。

### 4.2 API 与一个示例序列

`SinglyLinkedList<T>` 的 API 包括：`SinglyLinkedList()`、`bool isEmpty() const`、`size_t size() const`、`T get(size_t index) const`、`void add(const T& item)`（**在头部**）、`void add(size_t index, const T& item)`、`T remove()`（**删除头部**）以及 `T remove(size_t index)`。不带下标的 `add` 与 `remove` 作用于**头部**，这是链表开销最小的一端：与 ArrayList 正好相反，后者开销最小的是尾部。

下面是一个示例序列（下标从头节点开始计数，从 0 起算）：

| 步骤 | 调用 | 之后的列表 | `n` |
|---|---|---|---|
| 1 | `SinglyLinkedList<std::string> sll;` | 空 | 0 |
| 2–4 | `add("ICS 46")`、`add("ROCKS")`、`add("!")` | ! → ROCKS → ICS 46 | 3 |
| 5 | `add(1, "?")` | ! → ? → ROCKS → ICS 46 | 4 |
| 6 | `remove()` 返回 "!" | ? → ROCKS → ICS 46 | 3 |
| 7 | `remove(1)` 返回 "ROCKS" | ? → ICS 46 | 2 |

在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz linked-list
{"title": "单链表：add 与 remove", "ops": "add(ICS 46); add(ROCKS); add(!); add(1, ?); remove(); remove(1)", "interactive": true}
```

头部插入意味着元素取出的顺序与插入顺序**相反**。这正是 LIFO，也就是 [§7](#7-栈) 中栈的行为。

### 4.3 类：嵌套的 Node、head、tail 与 n

计划如下：实现我们自己的链表模板，其中包含一个**嵌套的 `struct Node`**，以及**元素个数的计数**。

```cpp
template <typename T>
class SinglyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;     // first node
    Node* tail = nullptr;     // last node
    size_t n = 0;             // number of items

public:
    SinglyLinkedList() = default;
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // copying not provided
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }   // or: return n == 0;
    size_t size() const { return n; }
    // get, add, remove ...
```

存储 `n` 使 `size()` 为 O(1)，代价是每个修改操作都必须同时更新它。只要不变式 **`head == nullptr` 当且仅当 `n == 0`** 成立，两种 `isEmpty` 写法就是一致的。析构函数通过不断删除头节点，直到链表为空，来释放每个节点。编译器默认生成的复制只会复制 `head`、`tail` 与 `n`，于是两个列表会共享同一条链，并把它释放两次；正式的类会实现五法则（rule of five）中的全部操作，而这里直接禁止复制。`Node` **没有默认构造函数**，这一点在下文很重要。

`tail` 指针在 4.4–4.10 节中没有用到，这些小节只使用 `head` 与 `n`。4.11 节会说明它带来了什么，并在那里标出维护它的四行代码；[第 13 节](#13-完整实现)的完整类包含了这些代码。

### 4.4 rangeCheck

凡是接受已有位置的方法，都先检查 `0 ≤ index < n`：

```cpp
    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
```

> ⚠️ **易错点**：对于无符号的 `size_t`，判断 `index < 0` 永远为假；而 `index > n` 会放过 `index == n`，这样 `get(n)` 就会解引用 `nullptr`。`get` 与 `remove` 应使用 `index >= n`。`add(index, item)` 允许 `index == n`（即追加），它自己检查 `index > n`。

对于一个有 2 个元素的列表，`get(2)` 会抛出 `out_of_range: index 2`（输出见[第 13 节](#13-完整实现)）。

### 4.5 get(index)：用游标遍历

唯一可以直接到达的节点是头节点，因此放一个临时指针（即**游标**）指向它，然后向前移动 `index` 次：

```cpp
    T get(size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; --index; }
        return finger->item;
    }
```

示例：对 ! → ? → ROCKS → ICS46 执行 `get(2)`，游标依次经过 "!"、"?"、"ROCKS"，并返回 "ROCKS"。最多需要 `n - 1` 步，因此为 **O(n)**。

> ⚠️ **易错点**：如果 `get` 忘记加 `const`，它就无法在 `const` 列表上调用。
### 4.6 add(item)：在头部插入

让新节点指向当前的第一个节点，然后让 `head` 指向新节点：

```cpp
    void add(const T& item) {
        Node* oldHead = head;                 // remember the current first node
        Node* newNode = new Node(item);       // allocate a node (next defaults to nullptr)
        newNode->next = oldHead;              // link the new node to the old head
        head = newNode;                       // the new node becomes the head
        ++n;                                  // one more node
    }
```

例如，对 ! → ? → ROCKS → ICS46 执行 `add("UCI")` 得到 `[UCI, !, ?, ROCKS, ICS46]`，`n = 5`。这里没有循环，因此为 **O(1)**，在空链表上同样适用（此时 `oldHead` 为 `nullptr`）。完整的类用一行写出同样的操作：`head = new Node(item, head);`（外加 [§4.11](#411-添加尾指针) 中关于 `tail` 的那一行）。

> ⚠️ **易错点**：要先连接，再移动 `head`。若先写 `head = newNode;`，就丢失了指向旧链表的唯一指针。单行写法 `head = new Node(item, head);` 以正确的顺序同时完成两件事。

### 4.7 add(index, item)：在下标处插入

要在 ! → ? → ROCKS → ICS46 的下标 2 处插入 "UCI"，必须修改的指针是 **"?" 的 `next`**，也就是位置*之前*的那个节点。因此要同时移动两个指针：`finger` 指向当前位于 `index` 处的节点，`previous` 始终落后一个节点。对于 `add(2, …)`，指针对 (`previous`, `finger`) 依次为 (nullptr, "!")、("!", "?")、("?", "ROCKS")，然后停止。

```cpp
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { add(item); return; }         // the head changes
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = new Node(item, finger);       // splice the new node in
        ++n;
    }
```

下标 0 是特殊情况，因为 `previous` 将保持为 `nullptr`：在头部插入改变的是 `head`，而不是某个节点的 `next`。下图展示 `add(2, "UCI")` 作用于 ! → ? → ROCKS → ICS46 时，从遍历到拼接的全过程。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz linked-list
{"title": "执行 add(2, \"UCI\")", "items": "!, ?, ROCKS, ICS46", "ops": "add(2, UCI)"}
```

例如，`add(2, "UCI")` 得到 `[!, ?, UCI, ROCKS, ICS46]`，`n = 5`；在 4 个元素的列表上执行 `add(4, "end")` 则是追加，得到 `[!, ?, ROCKS, ICS46, end]`。遍历最多需要 `n` 步，因此为 **O(n)**。

> ⚠️ **易错点**：这里不能写 `new Node()`，因为 `Node` 没有默认构造函数；应当带着数据构造节点，即 `new Node(item, finger)`。另外，下标应取 `size_t`，范围检查也要允许 `index == n`。

### 4.8 remove()：删除头节点

将 `head` 向右移动一个节点，然后删除旧的第一个节点：

```cpp
    T remove() {
        if (head == nullptr) throw std::out_of_range("remove() on an empty list");
        Node* temp = head;                    // the node to delete
        head = head->next;                    // move head one to the right
        --n;
        T item = temp->item;                  // copy the item out BEFORE delete
        delete temp;
        return item;
    }
```

先取出元素，**然后**再 `delete`，最后返回这个副本；`delete` 之后 `temp` 就成了悬空指针。例如，对 ! → ? → ROCKS → ICS 46 执行 `remove()` 返回 "!"。它是 **O(1)**。在空链表上没有可以解引用的头节点，因此检查会先抛出异常。

### 4.9 remove(index)：在下标处删除

做法与 `add(index, item)` 相同，都是遍历；当 `finger` 指向待删除的节点后，让 `previous` 跳过它。完整的方法就是 [4.12 节中的练习](#实现在下标处删除)的答案。对 ! → ? → ROCKS → ICS46 执行 `remove(2)`：遍历、绕过、删除。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz linked-list
{"title": "执行 remove(2)", "items": "!, ?, ROCKS, ICS46", "ops": "remove(2)"}
```

例如，对 ! → ? → UCI → ROCKS → ICS46 执行 `remove(2)` 返回 "UCI"。遍历使其成为 **O(n)**。

### 4.10 各操作的代价

问题始终是：*在执行常数时间的指针操作之前，必须越过多少个节点？* 在只有 `head` 指针的情况下：

| 操作 | 最坏情况 | 原因 |
|---|---|---|
| 在头部 `add(item)` | **O(1)** | 无循环 |
| `get(index)` | **O(n)** | 最多遍历 `n - 1` 步 |
| `add(index, item)` | **O(n)** | 遍历，然后 O(1) 拼接 |
| 在头部 `remove()` | **O(1)** | 移动 `head`，删除一个节点 |
| `remove(index)` | **O(n)** | 遍历，然后 O(1) 绕过 |
| 在尾部 add / remove（仅有 head） | **O(n)** | 遍历到末尾（删除时还需要倒数第二个节点） |

> 📘 **延伸阅读**（Thornton，Linked List Variations）：`get(i)` 实际上是 **Θ(i)**，因为 `get(0)` 在任何链表上都很快。"O(n)" 是对所有 `i` 取的最坏情况。

### 4.11 添加尾指针

添加一个指向最后一个节点的成员 `Node* tail`，并维持这样的不变式：只有在链表为空时 `tail == nullptr`，否则 `tail->next == nullptr`：

- **在尾部添加 → O(1)**：`tail->next = node; tail = node;`。在空链表上没有 `tail->next`，此时应改为设置 `head`。
- **在尾部删除 → 仍为 O(n)**：需要把*倒数第二个*节点的 `next` 设为 `nullptr`，而单链表无法从 `tail` 向后退。

```cpp
    void addLast(const T& item) {                      // insert at the tail, O(1)
        Node* node = new Node(item);
        if (tail == nullptr) head = node;              // the list was empty
        else tail->next = node;
        tail = node;
        ++n;
    }
```

其他方法中有四行代码负责维持 `tail` 的正确性：

| 方法 | 新增的一行 | 何时起作用 |
|---|---|---|
| `add(item)` | `if (tail == nullptr) tail = head;` | 向空链表添加：新节点同时是两端 |
| `remove()` | `if (head == nullptr) tail = nullptr;` | 删除最后一个节点后链表变空 |
| `remove(index)` | `if (finger == tail) tail = previous;` | 按下标删除最后一个节点 |
| `add(index, item)` | `if (index == n) { addLast(item); return; }` | 通过带下标的方法追加 |

> ⚠️ **易错点**：两种空链表的情况。向空链表添加时，必须同时设置 `head` 与 `tail`；删除最后一个节点时，必须把 `tail = nullptr` 复位，否则下一次 `addLast` 会通过指向已释放内存的指针写入。

> 💡 **关键洞见**：在单链表中，指向某个节点的指针只能改变它**之后**的内容，无法改变它**之前**的内容。

加入尾指针之后，代价变为：在尾部添加 **O(1)**，在尾部删除 **O(n)**；其他操作不变。

### 4.12 练习

#### 实现在下标处删除

假设链表只有头指针，请补全 `remove(size_t index)` 的 `else` 分支（`previous` 与 `finger` 像 `add(index, item)` 那样沿链表向下移动）：

```cpp
// Retrieves and removes the item at the specified index.
T remove(size_t index) {
    rangeCheck(index);                    // check that index is within range
    if (index == 0) {
        return remove();                  // index 0 is the head case
    } else {
        // TODO
    }
}
```

<details>
<summary>解答</summary>

```cpp
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = finger->next;    // bypass the node
        --n;
        T item = finger->item;            // copy out BEFORE delete
        delete finger;
        return item;
```

只有被删除节点*之前*的节点的 `next` 会改变，因此需要 `previous`；下标 0 要单独处理，因为此时需要修改的指针是 `head`。（在完整的类中，还要多一行 `if (finger == tail) tail = previous;`，以保持 tail 的正确性。）

</details>

#### 单链表操作的时间复杂度

请填写只有 `head` 指针的单链表在最坏情况下的复杂度：在头部 `add(item)` 为 O( )，在尾部为 O( )；`get(index)` 为 O( )；`add(index, item)` 为 O( )；从头部 `remove()` 为 O( )，从尾部为 O( )；`remove(index)` 为 O( )。

<details>
<summary>解答</summary>

在尾部添加为 **O(n)**（有尾指针时为 O(1)）；`get` 为 **O(n)**；`add(index)` 为 **O(n)**；从头部删除为 **O(1)**，从尾部删除为 **O(n)**（即使有尾指针也一样，因为无法回到倒数第二个节点）；`remove(index)` 为 **O(n)**。

</details>

## 5. 双链表

### 5.1 带 prev 的节点、head 与 tail

**双链表（DLL）**为每个节点再增加一个指向前一个节点的指针：

```cpp
    struct Node {
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr)
            : item(it), next(nx), prev(pv) {}
    };
```

各操作都写明了作用的端点：`DoublyLinkedList()`、`isEmpty()`、`size()`、`get(size_t index)`、`addFirst(item)`、`addLast(item)`、`add(size_t index, item)`、`T removeFirst()`、`T removeLast()`、`T remove(size_t index)`。列表保存一个 **head**（又称 Beginning、Front 或 First）和一个 **tail**（又称 End、Back 或 Last），以及计数 `n`。

下面五个小状态按顺序展示了列表先增长、后缩减的过程：

| 状态 | 节点 | head | tail |
|---|---|---|---|
| 1 | ICS 46（`prev` 与 `next` 均为空） | ICS 46 | ICS 46（同一节点） |
| 2 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 3 | ROCKS ⇄ ICS 46 ⇄ ! | ROCKS | ! |
| 4 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 5 | ICS 46 | ICS 46 | ICS 46 |

能按顺序产生这五个状态的一组操作。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz doubly-linked-list
{"title": "双链表的五个状态", "ops": "addLast(ICS 46); addFirst(ROCKS); addLast(!); removeLast(); removeFirst()", "interactive": true}
```

单节点状态是边界情况：此时 `head == tail`，因此向空链表添加或删除最后一个节点时，必须同时更新**两个**指针。

### 5.2 两端均为 O(1)

由于每个节点都知道自己的前驱，删除之后新的尾节点只需一步即可得到，即 `tail->prev`：

```cpp
    T removeLast() {                                   // O(1) thanks to prev
        if (isEmpty()) throw std::out_of_range("removeLast() on an empty list");
        Node* old = tail;
        tail = tail->prev;                             // second-to-last, one step away
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
```

`addLast` 与 `addFirst` 互为镜像。`addLast` 把新节点链接在尾节点之后（若链表原为空，则同时设置 `head`）；`addFirst` 把新节点链接在头节点之前（若链表原为空，则同时设置 `tail`）。`removeFirst` 与 `removeLast` 也是镜像关系。

在中间插入会改变**四个**链接（新节点的 `prev` 与 `next`，以及 `before->next` 与 `after->prev`）；删除中间的节点 `x` 则是 `x->prev->next = x->next; x->next->prev = x->prev;`：

```cpp
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);    // the new node's two links
        before->next = node;                           // the neighbours' two links
        after->prev = node;
        ++n;
    }
```

例如，依次执行 `addLast("ICS 46"); addFirst("ROCKS"); addLast("!")` 得到 `[ROCKS, ICS 46, !]`；从尾部反向遍历得到 `[!, ICS 46, ROCKS]`；然后 `removeLast()` 返回 "!"。

> 📘 **延伸阅读**（Thornton，Linked List Variations）：DLL 可以从距离更近的一端开始遍历，步数为 Θ(min(i, n − i)) ≤ n/2，速度更快，但**仍然是 O(n)**。完整类中的辅助函数 `nodeAt` 正是这样做的。

### 5.3 双链表分析

| 操作（head + tail） | 最坏情况 |
|---|---|
| 在头部 / 尾部插入 | **O(1)** / **O(1)** |
| `get(index)`、`add(index, item)`、`remove(index)` | **O(n)**（遍历） |
| 从头部 / 尾部删除 | **O(1)** / **O(1)**（`tail->prev`） |

### 5.4 练习

#### 双链表的时间复杂度分析

对于同时带有头指针与尾指针的双链表，请填写与单链表相同的表格：在头部与尾部添加、`get(index)`、`add(index, item)`、从头部与尾部删除、`remove(index)`。

<details>
<summary>解答</summary>

在头部插入 **O(1)**，在尾部插入 **O(1)**；`get` **O(n)**；`add(index)` **O(n)**；从头部删除 **O(1)**，从尾部删除 **O(1)**；`remove(index)` **O(n)**。与单链表相比，只有尾部相关的行发生了变化：`tail->prev` 一步就能到达倒数第二个节点。

</details>

## 6. ArrayList 与链表的比较

除非另有标注，均为最坏情况。

| 操作 | ArrayList | SLL（仅 head） | SLL + tail | DLL（head + tail） |
|---|---|---|---|---|
| 按下标获取 | **O(1)** | O(n) | O(n) | O(n) |
| 在前端添加 | O(n)（移位） | **O(1)** | **O(1)** | **O(1)** |
| 在末尾添加 | **O(1) 均摊** | O(n) | **O(1)** | **O(1)** |
| 删除前端 | O(n)（移位） | **O(1)** | **O(1)** | **O(1)** |
| 删除末尾 | **O(1) 均摊** | O(n) | O(n) | **O(1)** |
| 按下标添加 / 删除 | O(n)（移位） | O(n)（遍历） | O(n)（遍历） | O(n)（遍历） |

在 ArrayList 中，O(n) 来自**移位**；在链表中，则来自**遍历**，因为拼接本身是 O(1)。每个节点还要为指针额外付出内存（在本次测量所用的 g++ 编译结果上，保存一个 `int` 的单链表节点为 16 字节，双链表节点为 24 字节，而 ArrayList 每个槽位为 4 字节）。

> 💡 **关键洞见**（Thornton）：更多的链接换来更快的操作，代价是内存与更多的边界情况。应当选择能满足所需操作速度的最简单的变体。
## 7. 栈

### 7.1 栈 ADT

**栈**是一种动态的线性结构，元素以 **LIFO（后进先出）**的方式插入与删除：只操作一端，即**栈顶（top）**。可以把它想象成一摞煎饼：放上一个是 **push（压入）**，拿走顶上的一个是 **pop（弹出）**，只看一眼顶部而不取走则是 **peek（查看）**。目标是让 push 与 pop 尽可能高效。

| 操作 | 含义 |
|---|---|
| `push(item)` | 在栈顶加入一个元素 |
| `pop()` | 删除并返回栈顶元素（为空时报错） |
| `peek()` | 返回栈顶元素但不删除（为空时报错） |
| `isEmpty()`、`size()` | 是否为空、元素个数 |

### 7.2 push 与 pop 的追踪

输入 `To be or not to - be - - that - - - is`：单词表示 push，`-` 表示 pop：

| 操作之后 | 弹出的元素 | 栈（栈底 → 栈顶） |
|---|---|---|
| To be or not to | | To be or not to |
| `-` | to | To be or not |
| be、`-`、`-` | be、not | To be or |
| that、`-`、`-`、`-` | that、or、be | To |
| is | | To is |

编译后的输出：

```text
popped: to be not that or be
left on stack (top first): is To
```

在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz stack
{"title": "栈：To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```

### 7.3 基于 ArrayList 的栈

在 0–2 号槽中画出 "ICS46 ROCKS !"，其中下标 0 是**前端（front）**，最后一个元素是**末端（end，即 rear）**。把**栈顶放在末端**：push 即 `add(item)`，pop 即 `remove()`，peek 即 `get(size() - 1)`，其他元素都不移动。

```cpp
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;                                 // top = the end
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) amortized
    T pop() {                                          // O(1) amortized
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1)
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(list.size() - 1);
    }
};
```

测量结果（经过编译，统计元素的复制与移位次数，每次存入计为一次移动，共 n 次 push）：

```text
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)
```

栈顶位于末端时，每次 push 大约只需 2 次移动（均摊 O(1)）；栈顶位于前端时（每次 push 都执行 `add(0, item)`），每次 push 大约需要 n/2 次移动（O(n)）。

> 📘 **延伸阅读**（Thornton，Amortized Analysis）：均摊 O(1) 是对任意序列的**总**代价的界（n 次 push 的工作量 ≤ 3n），而不是对每次调用的界：使数组翻倍的那一次 push 是 O(n)。Peek 的 O(1) 则是真正的最坏情况。

### 7.4 基于链表的栈

栈（LIFO）只操作栈顶。在只有 `head` 的单链表（head → item1 → … → item5 → null）中，能在 O(1) 时间内修改的唯一一端是头部。因此把**栈顶放在头部**：push 即"在头部插入"（`add(item)`，[§4.6](#46-additem在头部插入)），pop 即"删除头节点"（`remove()`，[§4.8](#48-remove删除头节点)）。这三种操作**最坏情况都是 O(1)**。这与 ArrayList 栈相反，后者的栈顶位于末端。

```cpp
template <typename T>
class LinkedStack {
private:
    SinglyLinkedList<T> list;                          // top = the head
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) worst case
    T pop() {                                          // O(1) worst case
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1) worst case
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(0);
    }
};
```

压入 ICS46、ROCKS、! 然后全部弹出：

```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from an empty stack
```

其他布局：

- **带 head 与 tail 的双链表**：两端都是 O(1)，因此栈顶可以放在任一端，但每个节点都带着栈从不使用的 `prev`。
- **单链表的栈顶位于尾部**（反向）：只有 `head` 时，push、pop 与 peek 都是 **O(n)**（需要遍历到末尾）。增加 `tail` 指针可以使 push 与 peek 变为 O(1)，但 **pop 仍为 O(n)**：删除最后一个节点后，需要找到倒数第二个节点，而单链表只能从头部遍历才能找到它。

### 7.5 如何选择？

| 实现 | push / pop / peek | 权衡 | 何时更优 |
|---|---|---|---|
| ArrayList | 平均 O(1)、平均 O(1)、O(1) | 内存更少，整体更快，但性能呈**阶跃式** | 关注整体性能 |
| 单链表 | O(1)、O(1)、O(1)（**最坏情况**） | 链接额外占用时间与空间，但**保证**每个操作都很快 | 飞机进场降落的调度；数据包高速到达的互联网交换机 |
| 双链表 | O(1) | 额外的内存开销，性能与单链表相同 | — |

🔑 **最佳选择取决于具体问题。**

> 📘 **延伸阅读**：Thornton 把 ArrayList 的“平均 O(1)”称为**均摊** O(1)：对任何实际的 push 序列，总代价除以 push 次数是常数，因为一次 O(n) 的扩容会分摊到 n 次廉价的 push 上。但单次 push 仍可能是 O(n)。这就是“阶跃式”的含义，也是无法承受任何一次慢操作的系统会选择链表的原因。

### 7.6 练习

#### 用 ArrayList 实现栈

使用 **ArrayList**（操作 `add(item)`、`add(index, item)`、`remove()`）实现一个栈。(a) 栈顶应位于前端还是末端？(b) 如何实现 push、pop 与 peek？(c) pop 与 push 的**均摊**大 O 是多少？(d) peek 的**最坏情况**大 O 是多少？(e) 如果栈顶位于反向的一端，**最坏情况**的大 O 是多少？

<details>
<summary>解答</summary>

(a) **末端**（尾部/rear）：在那里添加与删除不需要移动任何元素。
(b) push = `add(item)`，pop = `remove()`，peek = `get(size() - 1)`。
(c) 均为 **O(1) 均摊**（数组翻倍或在 ¼ 满时缩容时偶尔为 O(n)）。
(d) **O(1)**。
(e) 栈顶在前端：push = `add(0, item)`，pop = `remove(0)` 都要移动所有元素 → **O(n)**；peek = `get(0)` 仍为 O(1)。

</details>

#### 用单链表或双链表实现栈

使用 (1) **单链表** 和 (2) **双链表** 各实现一个栈。(a) 栈顶应位于何处？(b) 如何用链表实现 pop、push 与 peek？(c) pop、push 与 peek 的最坏情况大 O 是多少？(d) 如果把栈顶放在反向的一端，最坏情况的大 O 是多少？

<details>
<summary>解答</summary>

- **(a)** 单链表：位于**头部**。带 head 与 tail 的双链表：两端均可。
- **(b)** push = 在头部插入；pop = 保存 `head`，将其前移，取出元素，删除旧节点；peek = `head->item`（pop 与 peek 都要检查是否为空）。代码见 [§7.4](#74-基于链表的栈) 中的 `LinkedStack`。
- **(c)** 全部为 **O(1) 最坏情况**。
- **(d)** 栈顶在尾部：仅有 head 的单链表全部为 O(n)；带 head 与 tail 的单链表 push 与 peek 为 O(1)，但 **pop 为 O(n)**；双链表通过 `tail->prev` 全部为 O(1)。

</details>

## 8. 队列

### 8.1 队列 ADT：FIFO

**队列**是一种动态的线性结构，它总是先移除**最早**到达的元素：元素按到达的确切顺序离开（FIFO，即先进先出）。它的比喻是排队买票的人群。

- **入队（enqueue）**：把新元素加到队列的**末端**（rear）。
- **出队（dequeue）**：删除队列**前端**（front）的元素。
- `front()` 查看前端元素，但不删除它。
- 目标是让**两种**操作的时间效率都尽可能高：队列有两个“工作端”，而栈只有一个。

### 8.2 队列操作示例

一个单词表示入队，`-` 表示出队并打印（输入与 [§7.2](#72-push-与-pop-的追踪) 中栈的示例相同）。队列按照从前端到后端的顺序书写：

| 步骤 | 输入 | 打印 | 之后的队列 |
|---|---|---|---|
| 1–5 | To be or not to | | To be or not to |
| 6 | `-` | **To** | be or not to |
| 7 | be | | be or not to be |
| 8–9 | `-` `-` | **be**、**or** | not to be |
| 10 | that | | not to be that |
| 11–13 | `-` `-` `-` | **not**、**to**、**be** | that |
| 14 | is | | that is |

在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz queue
{"title": "队列：To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```

输出与输入顺序一致，即 `To be or not to be`：队列从不重排元素。[第 13 节](#13-完整实现)中的编译程序会重放这一过程，打印 `dequeued: To be or not to be`，然后打印 `left in queue (2): front = that`。

### 8.3 实现方案概览

同样的四个问题也适用于 ArrayList、单链表和双链表：在哪一端入队与出队，如何实现，最坏情况（或均摊）运行时间是多少，以及如果反转方向会发生什么。答案汇总在下表中：

| 结构与布局 | enqueue | dequeue |
|---|---|---|
| ArrayList，前端 = 下标 0，后端 = 末端 | O(1) 均摊 | **O(n)**（向左移位） |
| ArrayList 反向，后端 = 下标 0，前端 = 末端 | **O(n)**（向右移位） | O(1) |
| 循环数组（[§9](#9-循环数组队列)） | O(1) 均摊 | O(1) |
| 单链表，仅 head，前端 = head | **O(n)**（遍历到末尾） | O(1) |
| 单链表，仅 head，反向 | O(1) | **O(n)** |
| ✅ 单链表，head + tail，前端 = head，后端 = tail | O(1) | O(1) |
| ❌ 单链表，head + tail，反向 | O(1) | **O(n)** |
| 双链表，head + tail，任一方向 | O(1) | O(1) |

### 8.4 基于 ArrayList 的队列

ArrayList 把下标 0 固定在单元 0 中，因此无论队列的哪一端位于下标 0，都要付出 O(n) 的代价：其他每个元素都要移动。常见的布局是用 `add(item)` 入队，用 `remove(0)` 出队：

```cpp
template <typename T>
class ArrayListQueue {                                 // front = index 0
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.add(item); }    // O(1) amortized
    T dequeue() {                                      // O(n): everything shifts left
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove(0);
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};
```

依次入队 ICS46、ROCKS、! 然后清空队列，会打印 `ICS46 ROCKS !`。

### 8.5 带尾指针的单链表

只有 `head` 时，有一种操作总是 O(n)。**解决办法：保留一个 `tail` 指针**，在尾部入队，在头部出队。方向依然重要：`tail` 让你能在最后一个节点之后 *添加* 元素（O(1)），但无法 *删除* 它（删除需要它的前驱）。因此，`LinkedQueue` 就是通过 `addLast` 与 `remove` 使用的 `SinglyLinkedList`（见 [§4.11](#411-添加尾指针)）：

```cpp
template <typename T>
class LinkedQueue {                                    // front = head, rear = tail
private:
    SinglyLinkedList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.addLast(item); }   // O(1)
    T dequeue() {                                         // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove();
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};
```

先向非空队列入队，然后清空它，并观察最后一次 `dequeue()` 如何复位 `tail`。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz queue
{"title": "带 head 与 tail 的单链表", "ops": "enqueue(ICS46); enqueue(ROCKS); enqueue(!); dequeue(); dequeue(); dequeue()"}
```

> ⚠️ **易错点**：空队列有两种情况。向空队列入队时，没有可以设置的 `tail->next`，因此必须同时设置 `head`。出队最后一个元素时，必须把 `tail = nullptr` 复位，否则下一次入队会通过已释放的内存写入。这两种情况都已在链表的 `addLast` 与 `remove()` 中处理。

### 8.6 双链表

带 head 与 tail 的双链表（ROCKS 处为 Head/Front，"!" 处为 Tail/Back）可以在**两端**以 O(1) 插入与删除（删除之后的新尾节点为 `tail->prev`），因此两个方向的入队与出队都是 O(1)。代价是每个节点多出一个 `prev`，而速度相对于带尾指针的单链表并没有提升。当用节点来构造**双端队列**（deque，即双端队列，[§10](#10-双端队列)）时，也需要双链表：两端都要插入与删除。

### 8.7 什么是最佳选择？

依据与栈相同的推理（[§7.5](#75-如何选择)）：

- **ArrayList**：按原样使用时，出队为 O(n)，是很差的队列。若作为循环数组使用：O(1) 均摊，内存最省，但性能呈阶跃式。
- **单链表**：带有 tail 指针时，两种操作的最坏情况都是 O(1)，这一保证的代价是每个节点一个指针。
- **双链表**：两种操作都是 O(1)，但每个节点多出 `prev` 指针，性能却没有更好。
- 最佳选择取决于具体问题（追求整体吞吐量选循环数组；要求每个操作都快选带 tail 的单链表）。

### 8.8 练习

#### 用 ArrayList 实现队列

使用 **ArrayList** 实现一个队列。应在哪一端入队和出队？请实现 enqueue 与 dequeue。它们的最坏情况（或均摊）运行时间是多少？如果把 enqueue 与 dequeue 的方向反过来，又会怎样？

<details>
<summary>解答</summary>

- 用 `list.add(item)` 在末端入队，用 `list.remove(0)` 在下标 0 处出队。
- 入队 **O(1) 均摊**；出队 **O(n)**（所有元素向左移位）。
- 反向（`add(0, item)` / `remove()`）：入队 **O(n)**，出队 O(1)。
- 无论哪种方式，都有一种操作为 O(n)，因为 ArrayList 把下标 0 固定在单元 0 中（[§9](#9-循环数组队列) 给出了解决办法）。

</details>

#### 用单链表实现队列

使用 **单链表** 实现一个队列。应在哪一端入队和出队？请实现 enqueue 与 dequeue。它们的最坏情况运行时间是多少？如果把 enqueue 与 dequeue 的方向反过来，又会怎样？要做哪些修改才能让两种操作都为 O(1)？

<details>
<summary>解答</summary>

- 在头部出队，在最后一个节点处入队。
- 仅有 head：出队 O(1)，入队 **O(n)**。反向：入队 O(1)，出队 **O(n)**。
- 修改方法：增加 **tail 指针**，令前端 = head、后端 = tail，两者均为 O(1)（[§8.5](#85-带尾指针的单链表)）。
- 陷阱：即使有 tail 指针，反向的方向在出队时仍是 O(n)。

</details>

#### 用双链表实现队列

使用 **双链表** 实现一个队列。应在哪一端入队和出队？请实现 enqueue 与 dequeue。它们的最坏情况运行时间是多少？如果把 enqueue 与 dequeue 的方向反过来，又会怎样？

<details>
<summary>解答</summary>

- 在尾部入队（`newNode->prev = tail; tail->next = newNode; tail = newNode;`，若链表为空则设置 `head`），在头部出队（`head = head->next; head->prev = nullptr;`，若变为空则 `tail = nullptr`）。使用 `DoublyLinkedList` 类时，这对应 `addLast` 与 `removeFirst`。
- 两者最坏情况都是 **O(1)**，反向时仍为 O(1)。代价是多出的 `prev` 指针。

</details>

## 9. 循环数组队列

### 9.1 为什么不用普通的 ArrayList？

队列在后端入队，在前端出队。如果把队列保存在 ArrayList 中，并让前端固定在下标 0，那么每次 `dequeue()` 都必须把剩余的所有元素向左移动，代价为 O(n)（`[A B C D]` → 出队 → `[B C D]`）。

**循环数组**则改为移动起始下标。出队时，**前端下标**只需向前移动一格，没有任何元素需要移动，因此出队为 O(1)（A 出队后，`front` 从 0 移到 1，而 B、C、D 留在原位）。

> 📘 **延伸阅读**（Thornton，*Stacks, Queues, and Deques*）：正常使用的 `std::vector` 也有同样的问题。它总是把元素保存在单元 0…size−1 中，因此队列的一端被固定在单元 0，入队或出队都会变成 Θ(n)。解决办法是使用前后下标都可以“浮动”的普通数组。

### 9.2 前端、后端与回绕

循环数组队列在**定长数组**中实现队列，并维护两个下标：

- `front_idx`：前端元素的位置。
- `rear_idx`：按一种约定，它指向**最后一个有效元素**；按另一种约定，它指向**下一个空位**。我们采用“下一个空位”的约定。

两个下标都只向前移动。当某个下标到达数组末尾时，它会用取模运算**回绕**到 0：

```text
index = (index + 1) % capacity
```

因此，队列中的元素是从 `front` 开始向右的各个槽位，必要时会继续到槽位 0（例如：容量为 6，`front_idx = 1`，队列为槽位 1–4 中的 A B C D，后端位于槽位 4）。

| 操作 | 算法 | 代价 |
|---|---|---|
| enqueue(value) | `array[rear_idx] = value;` `rear_idx = (rear_idx + 1) % capacity;` | O(1) |
| dequeue() | `val = array[front_idx];` `front_idx = (front_idx + 1) % capacity;` 返回 `val` | O(1) |

在下方逐步查看（演示获得焦点后，← / → 键可用）。该演示采用 [§9.3](#93-满与空) 的“记录大小”约定：后端槽位为 `(front + n) % capacity`。注意 F 如何回绕到槽位 0：

```viz circular-queue
{"title": "容量为 5 的循环数组队列", "ops": "A B C D - - E F G", "capacity": 5, "interactive": true}
```

经编译运行，该演示的最终状态为 `[F G C D E] f=2 n=5`：F 与 G 已回绕到槽位 0 与 1，前端位于槽位 2。

> ⚠️ **易错点**：对于容量固定的循环数组，入队与出队是纯粹的 **O(1) 最坏情况**，而不是“均摊”。只有当数组在满时会**扩容**（[§9.4](#94-记录大小的版本)）时，才会引入“均摊”。

### 9.3 满与空

如果 `rear_idx` 指向下一个空槽，那么无论队列为空还是所有槽位都已填满，都会有 `front == rear`。区分这两种情况有两种方法：

1. **始终保留一个空槽。** 此时
   - 空：`front == rear`
   - 满：`(rear + 1) % capacity == front`

   代价是浪费一个槽位。
2. **记录大小** `n`。空即 `n == 0`，满即 `n == cap`，并且完全不需要 `rear`，因为它等于 `(front + n) % cap`。

### 9.4 记录大小的版本

> 📘 **延伸阅读**：Thornton 与 algs4 的做法是让前端移动，从而固定数组。保存 `f`（前端元素的下标）与 `n`（元素个数）。入队写入 `(f + n) % cap` 并执行 `++n`；出队读取 `data[f]`，然后执行 `f = (f + 1) % cap` 与 `--n`。两者都是 O(1)（数组翻倍时入队为均摊 O(1)）。需要保留计数 `n`：如果只有前端与后端下标，“满”和“空”看起来完全相同。

`CircularQueue<T>` 保存 `data`、`cap`、`f` 与 `n`。数组已满时，`enqueue` 会将其翻倍。元素可能会跨过旧数组的末尾，因此新数组不能逐单元复制。取而代之的是按队列顺序**展开**：对于 k = 0 … n−1，新 `[k]` = 旧 `[(f + k) % cap]`，然后令 `f = 0`：

```cpp
    void resize(size_t newCap) {                       // unroll into a bigger array
        T* bigger = new T[newCap];
        for (size_t k = 0; k < n; ++k) bigger[k] = data[(f + k) % cap];
        delete[] data;
        data = bigger;
        cap = newCap;
        f = 0;
    }

    void enqueue(const T& item) {
        if (n == cap) resize(2 * cap);
        data[(f + n) % cap] = item;                    // the rear slot
        ++n;
    }
    T dequeue() {
        if (n == 0) throw std::underflow_error("dequeue from an empty queue");
        T item = data[f];
        f = (f + 1) % cap;                             // nothing moves
        --n;
        return item;
    }
```

翻倍之后，入队为**均摊 O(1)**（论证与 [第 3 节](#3-扩容与均摊分析)中的 ArrayList 相同），出队为 O(1)。

例如（容量为 2，翻倍到 4）：入队 1、2、3；出队 1、2；入队 4、5。编译后的程序会打印物理单元（`_` 表示未使用）：

```text
enqueue 1 2 3   [1 2 3 _] f=0 n=3 cap=4
dequeue x2      [_ _ 3 _] f=2 n=1
enqueue 4 5     [5 _ 3 4] f=2 n=3
```

此时 `f = 2`，5 已回绕到单元 0：单元为 `[5, _, 3, 4]`，队列顺序为 3 4 5。同一示例在容量为 4 的数组上运行（此处无需扩容）。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz circular-queue
{"title": "循环数组：前端移动，无需移位", "ops": "1 2 3 - - 4 5", "capacity": 4, "interactive": true}
```
## 10. 双端队列

### 10.1 双端队列 ADT

**双端队列**（deque，即 double-ended queue，读作 "deck"）可以在**两端**添加与删除：

| 操作 | 含义 |
|---|---|
| `enqueueFront(x)` / `enqueueBack(x)` | 在前端 / 后端添加 |
| `dequeueFront()` / `dequeueBack()` | 从前端 / 后端删除并返回 |
| `front()` / `back()` | 查看前端 / 后端元素，但不删除 |

- 若**前端下标**指向第一个元素，**后端下标**指向下一个元素将放入的位置（或指向最后一个元素），那么双端队列就是一个循环数组，其中**两个下标都可以向两个方向移动**。在 [§9.4](#94-记录大小的版本) 的记录大小布局中，`enqueueBack` 写入后端槽位 `(f + n) % cap`，`dequeueBack` 取出位于 `(f + n − 1) % cap` 的最后一个元素，而 `enqueueFront` 使 `f` *向左*移动，并从 0 回绕到 `cap − 1`：`f = (f + cap − 1) % cap`。
- 它是一种**多用途的结构**：只使用一端，它就是栈；在一端添加、另一端删除，它就是队列。
- C++ 提供了它的实现：`std::deque`。
- 若以**链表**实现，双端队列需要在两端删除，因此应使用**双链表**（单链表无法以 O(1) 删除最后一个节点）；参见 [§5](#5-双链表)。
- `Deque<T>` 类复用了 `CircularQueue<T>`：它的 `enqueue` 即 `enqueueBack`，它的 `dequeue` 即 `dequeueFront`，继承了 [§9.4](#94-记录大小的版本) 中的 `resize`，并额外提供 `enqueueFront`、`dequeueBack` 与 `back`。
- 扩容与循环队列相同，同样是展开后复制，因此在翻倍策略下，每次入队为**均摊 O(1)**，每次出队为 O(1)。

> ⚠️ **易错点**：当 `f` 为 0 时，`(f - 1) % cap` 在 C++ 中是一个很大的数（若使用有符号整数则为 −1），因为 `%` 的结果符号与左操作数一致，而 `size_t` 会回绕。应先加上 `cap` 再取模：`(f + cap - 1) % cap`。

### 10.2 练习

#### 基于循环数组的双端队列

在循环数组上实现双端队列的以下方法，并更新前端与后端下标：

1. `enqueueFront(val)`：在双端队列的前端添加一个元素
2. `enqueueBack(val)`：在双端队列的后端添加一个元素
3. `dequeueFront()`：删除并返回前端的元素
4. `dequeueBack()`：删除并返回后端的元素

**挑战问题：** 动态扩大循环数组时，应如何更新双端队列？（向已满的双端队列添加元素时，需要扩大容量。）

> 提示：保存 `f` 与大小 `n`；这样后端元素就位于 `(f + n − 1) % cap`。

<details>
<summary>解答</summary>

保存 `f` 与 `n`（即 [§9.3](#93-满与空) 的第二种方案）。后端槽位为 `(f + n) % cap`。

```cpp
void enqueueFront(const T& item) {
    if (n == cap) resize(2 * cap);
    f = (f + cap - 1) % cap;                     // step left, wrapping
    data[f] = item;
    ++n;
}
void enqueueBack(const T& item) {
    if (n == cap) resize(2 * cap);
    data[(f + n) % cap] = item;                  // rear slot
    ++n;
}
T dequeueFront() {
    if (n == 0) throw std::underflow_error("dequeueFront from an empty deque");
    T item = data[f];
    f = (f + 1) % cap;
    --n;
    return item;
}
T dequeueBack() {
    if (n == 0) throw std::underflow_error("dequeueBack from an empty deque");
    T item = data[(f + n - 1) % cap];            // last element
    --n;
    return item;
}
```

**挑战：扩容。** 不能把旧数组逐单元复制到相同位置，因为元素可能跨过数组末尾。分三步进行：

1. **分配**一个更大的数组（容量翻倍）。
2. 按双端队列的顺序，把元素**展开**到新数组中：对于 k = 0 … n−1，新 `[k]` = 旧 `[(f + k) % cap]`。
3. **复位** `f = 0`；此时后端槽位即为 `n`（在记录大小的版本中，`rear` 直接由 `n` 推出）。这就是 [§9.4](#94-记录大小的版本) 中的 `resize`。

在翻倍策略下，每次入队为**均摊 O(1)**，出队为 O(1)。下面是从容量 2 开始的一次测试运行：`enqueueBack(1); enqueueBack(2); enqueueFront(0); enqueueFront(-1); enqueueBack(3)`，然后完整遍历一次双端队列，再执行一次 `dequeueFront()`、一次 `dequeueBack()`，并持续执行 `dequeueFront` 直到为空：

```text
deque size=5 capacity=8 : -1 0 1 2 3
front=-1 back=3
dequeued: -1 3 0 1 2
```

</details>

## 11. 栈的应用：表达式求值

### 11.1 栈出现在哪里？

栈是编译器与解释器中的基本机制，浏览器的后退按钮与文字处理软件的撤销功能也都以它为基础。本节讨论的是编译器与解释器的场景：算术求值。

### 11.2 中缀与后缀

- **中缀**：运算符位于其操作数**之间**，这是标准的数学记号，需要括号来表示优先级。例如：`( ( 2 + 3 ) * ( 4 * 5 ) )`。
- **后缀**：运算符位于其操作数**之后**，**不需要括号**；只需一个栈，从左到右即可求值，没有歧义。

要把一个完全加括号的中缀表达式转换为后缀，应从最内层开始，逐层向外，把每个 `( a op b )` 改写为 `a b op`：
`( ( 2 + 3 ) * ( 4 * 5 ) )` ⇒ `((2 3 +) * (4 5 *))` ⇒ **`2 3 + 4 5 * *`**。操作数的顺序保持不变，只有运算符会移动。

### 11.3 Dijkstra 双栈算法

用一个**值栈**和一个**运算符栈**，从左到右读取完全加括号的中缀表达式：

- 值：压入值栈。
- 运算符：压入运算符栈。
- 左括号：忽略。
- 右括号：弹出一个运算符和两个值，把该运算符作用于这两个值的结果压入值栈。

algs4 示例 `( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )` 的追踪过程（栈均为栈底 → 栈顶）：

| 标记 | 值栈 | 运算符栈 |
|---|---|---|
| `( 1 + ( ( 2 +` | 1 2 | + + |
| `3 )` → 2 + 3 | 1 5 | + |
| `* ( 4 * 5 )` → 4 * 5 | 1 5 20 | + * |
| `)` → 5 * 20 | 1 100 | + |
| `)` → 1 + 100 | **101** | |

每个运算都必须包裹在自己的括号中：`)` 是在提示“立即应用最近的运算符”。在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz two-stack-eval
{"title": "Dijkstra 双栈算法", "expression": "( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )", "interactive": true}
```

### 11.4 操作数的顺序

**先弹出的值是右操作数**（它最后被压入）；随后弹出的是左操作数。写成代码就是：`v1 = pop()`，`v2 = pop()`，`push(v2 op v1)`。

例如，`( 10 - 4 )` 先弹出 4，再弹出 10，结果为 10 − 4 = **6**。若顺序颠倒，则得到 4 − 10 = −6。对于 `+` 与 `*`，顺序无关。
> ⚠️ **易错点**：减号与除号的顺序很重要。写下 `v1` 与 `v2`，然后计算 `v2 op v1`。（有些算法演示中操作数顺序是颠倒的；对于 `+` 与 `*`，结果看起来仍然正确。）

算法的代码形式如下，其中值使用 `LinkedStack<long>`，运算符使用 `LinkedStack<std::string>`；`applyOp(op, left, right)` 返回 `left op right`：

```cpp
long evalInfix(const std::string& expr) {
    LinkedStack<long> values;
    LinkedStack<std::string> ops;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "(") continue;              // ignore
        if (isOperator(tok)) ops.push(tok);
        else if (tok == ")") {
            std::string op = ops.pop();
            long v1 = values.pop();            // right operand
            long v2 = values.pop();            // left operand
            values.push(applyOp(op, v2, v1));
        } else {
            values.push(std::stol(tok));
        }
    }
    return values.pop();
}
```

### 11.5 后缀求值

从左到右处理表达式：若标记是操作数，则压入；若是运算符，则弹出两个操作数，并压入该运算的结果。最终答案就是剩下的唯一元素（即 `peek()`）。下面是 `(52 - ((5 + 7) * 4))` ⇒ `52 5 7 + 4 * -` 的追踪（栈底 → 栈顶）：

| 标记 | 动作 | 栈 |
|---|---|---|
| `52` `5` `7` | 压入 ×3 | 52 5 7 |
| `+` | v1=7，v2=5，push(v2+v1)=12 | 52 12 |
| `4` | push(4) | 52 12 4 |
| `*` | v1=4，v2=12，push(v2*v1)=48 | 52 48 |
| `-` | v1=48，v2=52，push(v2-v1)=4 | 4 → peek()=4 |

在下方逐步查看（演示获得焦点后，← / → 键可用）：

```viz postfix-eval
{"title": "后缀求值：52 5 7 + 4 * -", "expression": "52 5 7 + 4 * -", "interactive": true}
```

```cpp
long evalPostfix(const std::string& expr) {
    LinkedStack<long> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            long v1 = s.pop();                 // right operand (popped first)
            long v2 = s.pop();                 // left operand
            s.push(applyOp(tok, v2, v1));      // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}
```

对 `52 5 7 + 4 * -`、`5 1 2 + 4 * + 3 -` 与 `10 4 -` 执行 `evalPostfix`，分别得到 `4`、`14` 与 `6`。

### 11.6 后缀转回中缀

如果栈中保存的是表达式字符串而不是数字，同样的循环可以把后缀转换回完全加括号的中缀表达式。遇到运算符时，先弹出右子表达式，再弹出左子表达式，然后压入 `"(" + left + " op " + right + ")"`：

```cpp
std::string postfixToInfix(const std::string& expr) {
    LinkedStack<std::string> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            std::string right = s.pop();
            std::string left = s.pop();
            s.push("(" + left + " " + tok + " " + right + ")");
        } else {
            s.push(tok);
        }
    }
    return s.pop();
}
```

### 11.7 练习

#### 求值中缀与后缀表达式

- 使用双栈方法对**中缀**表达式 `( ( 2 + 3 ) * ( 4 * 5 ) )` 求值。
- 使用一个栈对**后缀**表达式 `5 1 2 + 4 * + 3 -` 求值。
- 把该后缀表达式转换回中缀。

<details>
<summary>解答</summary>

**(a)** = **100**。值 / 运算符（栈底 → 栈顶）：处理 `( ( 2 + 3 )` 之后为 5 / 空；处理 `* ( 4 * 5 )` 之后为 5 20 / `*`；最后的 `)` 得到 5 × 20 = 100。

**(b)** = **14**：

| 标记 | 动作 | 栈 |
|---|---|---|
| `5` `1` `2` | 压入 ×3 | 5 1 2 |
| `+` | v1=2，v2=1 → 3 | 5 3 |
| `4` `*` | v1=4，v2=3 → 12 | 5 12 |
| `+` | v1=12，v2=5 → 17 | 17 |
| `3` `-` | v1=3，v2=17 → 14 | 14 |

逐步检查 (a) 与 (b)：

```viz two-stack-eval
{"title": "中缀检查 (a)", "expression": "( ( 2 + 3 ) * ( 4 * 5 ) )"}
```

```viz postfix-eval
{"title": "后缀检查 (b)", "expression": "5 1 2 + 4 * + 3 -"}
```

**(c)** 改为压入表达式而不是数字：`((5 + ((1 + 2) * 4)) - 3)`，即 5 + (1 + 2) × 4 − 3 = 14。操作数的顺序 5、1、2、4、3 没有改变（这就是 `postfixToInfix`，见 [§11.6](#116-后缀转回中缀)）。

</details>

## 12. 队列的应用

音乐播放列表（歌曲按入队顺序播放）、数据缓冲区（视频流）、异步数据传输（文件 I/O、套接字）、共享资源的请求（打印机）、流量分析，以及呼叫中心的等待时间。

> 💡 **关键洞见**：当**输入速率与输出速率不匹配**时使用队列：元素成批到达、稳定地被处理，队列按到达顺序保存积压的元素。

## 13. 完整实现

这一族类可以编译为一个头文件加一个测试程序。`linear.hpp` 包含本章的所有类：`ArrayList`、`SinglyLinkedList`（带 `tail`）、`DoublyLinkedList`、两种栈、两种基于链表的队列、`CircularQueue` 与 `Deque`。`main.cpp` 增加了表达式求值器，并重放本章的追踪过程。使用 `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined` 构建：没有警告，也没有 sanitizer 报告。

### 13.1 linear.hpp

```cpp
#pragma once
#include <cstddef>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>

// ---------------------------------------------------------------------------
// ArrayList: a resizable array. Cells [0, n) hold the items, [n, cap) are unused.
// ---------------------------------------------------------------------------
template <typename T>
class ArrayList {
private:
    T* data;          // the underlying array
    size_t cap;       // allocated length
    size_t n;         // number of items

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
    void resize(size_t newCap) {
        T* bigger = new T[newCap];
        for (size_t i = 0; i < n; ++i) bigger[i] = data[i];   // the Theta(n) copy
        delete[] data;
        data = bigger;
        cap = newCap;
    }
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (cap > 1 && n <= cap / 4) resize(cap / 2);
    }

public:
    ArrayList() : ArrayList(2) {}                      // default capacity 2
    explicit ArrayList(size_t capacity)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1), n(0) {}

    // Rule of three: we own data, so copying must copy the buffer.
    ~ArrayList() { delete[] data; }
    ArrayList(const ArrayList& other)
        : data(new T[other.cap]), cap(other.cap), n(other.n) {
        for (size_t i = 0; i < n; ++i) data[i] = other.data[i];
    }
    ArrayList& operator=(ArrayList other) {            // copy-and-swap
        std::swap(data, other.data);
        std::swap(cap, other.cap);
        std::swap(n, other.n);
        return *this;
    }

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }
    size_t capacity() const { return cap; }

    T get(size_t index) const { rangeCheck(index); return data[index]; }
    void set(size_t index, const T& item) { rangeCheck(index); data[index] = item; }

    void add(const T& item) {                          // append at the end
        if (n == cap) resize(2 * cap);
        data[n++] = item;
    }
    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (n == cap) resize(2 * cap);
        for (size_t i = n; i > index; --i) data[i] = data[i - 1];   // back to front
        data[index] = item;
        ++n;
    }
    T remove() {                                       // remove from the end
        if (n == 0) throw std::out_of_range("remove() on an empty list");
        T item = data[--n];
        shrinkIfSparse();
        return item;
    }
    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data[index];
        for (size_t i = index; i + 1 < n; ++i) data[i] = data[i + 1];   // front to back
        --n;
        shrinkIfSparse();
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (size_t i = 0; i < n; ++i) out << (i ? ", " : "") << data[i];
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// SinglyLinkedList: head and tail pointers. add() / remove() work at the head.
// ---------------------------------------------------------------------------
template <typename T>
class SinglyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;     // first node
    Node* tail = nullptr;     // last node
    size_t n = 0;             // number of items

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }

public:
    SinglyLinkedList() = default;
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // copying not provided
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }
    size_t size() const { return n; }

    T get(size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; --index; }
        return finger->item;
    }

    void add(const T& item) {                          // insert at the head, O(1)
        head = new Node(item, head);
        if (tail == nullptr) tail = head;              // the list was empty
        ++n;
    }
    void addLast(const T& item) {                      // insert at the tail, O(1)
        Node* node = new Node(item);
        if (tail == nullptr) head = node;              // the list was empty
        else tail->next = node;
        tail = node;
        ++n;
    }
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { add(item); return; }
        if (index == n) { addLast(item); return; }
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = new Node(item, finger);
        ++n;
    }

    T remove() {                                       // remove the head, O(1)
        if (head == nullptr) throw std::out_of_range("remove() on an empty list");
        Node* temp = head;
        head = head->next;
        if (head == nullptr) tail = nullptr;           // the list became empty
        --n;
        T item = temp->item;                           // copy out BEFORE delete
        delete temp;
        return item;
    }
    T remove(size_t index) {                           // remove at index
        rangeCheck(index);
        if (index == 0) return remove();
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = finger->next;                 // bypass the node
        if (finger == tail) tail = previous;
        --n;
        T item = finger->item;
        delete finger;
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = head; x != nullptr; x = x->next)
            out << x->item << (x->next != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// DoublyLinkedList: every node also knows its predecessor.
// ---------------------------------------------------------------------------
template <typename T>
class DoublyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr)
            : item(it), next(nx), prev(pv) {}
    };
    Node* head = nullptr;
    Node* tail = nullptr;
    size_t n = 0;

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
    Node* nodeAt(size_t index) const {                 // walk from the nearer end
        if (index < n / 2) {
            Node* x = head;
            for (size_t i = 0; i < index; ++i) x = x->next;
            return x;
        }
        Node* x = tail;
        for (size_t i = n - 1; i > index; --i) x = x->prev;
        return x;
    }

public:
    DoublyLinkedList() = default;
    ~DoublyLinkedList() { while (!isEmpty()) removeFirst(); }
    DoublyLinkedList(const DoublyLinkedList&) = delete;
    DoublyLinkedList& operator=(const DoublyLinkedList&) = delete;

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }

    T get(size_t index) const { rangeCheck(index); return nodeAt(index)->item; }

    void addFirst(const T& item) {
        Node* node = new Node(item, nullptr, head);
        if (head != nullptr) head->prev = node; else tail = node;
        head = node;
        ++n;
    }
    void addLast(const T& item) {
        Node* node = new Node(item, tail, nullptr);
        if (tail != nullptr) tail->next = node; else head = node;
        tail = node;
        ++n;
    }
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);    // the new node's two links
        before->next = node;                           // the neighbours' two links
        after->prev = node;
        ++n;
    }

    T removeFirst() {
        if (isEmpty()) throw std::out_of_range("removeFirst() on an empty list");
        Node* old = head;
        head = head->next;
        if (head != nullptr) head->prev = nullptr; else tail = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
    T removeLast() {                                   // O(1) thanks to prev
        if (isEmpty()) throw std::out_of_range("removeLast() on an empty list");
        Node* old = tail;
        tail = tail->prev;
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
    T remove(size_t index) {
        rangeCheck(index);
        if (index == 0) return removeFirst();
        if (index == n - 1) return removeLast();
        Node* victim = nodeAt(index);
        victim->prev->next = victim->next;
        victim->next->prev = victim->prev;
        T item = victim->item;
        delete victim;
        --n;
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = head; x != nullptr; x = x->next)
            out << x->item << (x->next != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
    std::string toStringBackwards() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = tail; x != nullptr; x = x->prev)
            out << x->item << (x->prev != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// Stacks: top = the cheap end of the list.
// ---------------------------------------------------------------------------
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;                                 // top = the end
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) amortized
    T pop() {                                          // O(1) amortized
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1)
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(list.size() - 1);
    }
};

template <typename T>
class LinkedStack {
private:
    SinglyLinkedList<T> list;                          // top = the head
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) worst case
    T pop() {                                          // O(1) worst case
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1) worst case
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(0);
    }
};

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------
template <typename T>
class ArrayListQueue {                                 // front = index 0
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.add(item); }    // O(1) amortized
    T dequeue() {                                      // O(n): everything shifts left
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove(0);
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};

template <typename T>
class LinkedQueue {                                    // front = head, rear = tail
private:
    SinglyLinkedList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.addLast(item); }   // O(1)
    T dequeue() {                                         // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove();
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};

// Circular array: f = index of the front item, n = number of items.
template <typename T>
class CircularQueue {
protected:
    T* data;
    size_t cap;
    size_t f = 0;
    size_t n = 0;

    void resize(size_t newCap) {                       // unroll into a bigger array
        T* bigger = new T[newCap];
        for (size_t k = 0; k < n; ++k) bigger[k] = data[(f + k) % cap];
        delete[] data;
        data = bigger;
        cap = newCap;
        f = 0;
    }

public:
    explicit CircularQueue(size_t capacity = 2)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1) {}
    ~CircularQueue() { delete[] data; }
    CircularQueue(const CircularQueue&) = delete;
    CircularQueue& operator=(const CircularQueue&) = delete;

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }
    size_t capacity() const { return cap; }

    void enqueue(const T& item) {
        if (n == cap) resize(2 * cap);
        data[(f + n) % cap] = item;                    // the rear slot
        ++n;
    }
    T dequeue() {
        if (n == 0) throw std::underflow_error("dequeue from an empty queue");
        T item = data[f];
        f = (f + 1) % cap;                             // nothing moves
        --n;
        return item;
    }
    T front() const {
        if (n == 0) throw std::underflow_error("front of an empty queue");
        return data[f];
    }

    std::string layout() const {                       // the physical cells, '_' = unused
        std::ostringstream out;
        out << '[';
        for (size_t c = 0; c < cap; ++c) {
            if (c) out << ' ';
            if ((c + cap - f) % cap < n) out << data[c]; else out << '_';
        }
        out << "] f=" << f << " n=" << n;
        return out.str();
    }
};

// Deque: the same circular array, with both ends open.
template <typename T>
class Deque : public CircularQueue<T> {
    using Base = CircularQueue<T>;
    using Base::data;
    using Base::cap;
    using Base::f;
    using Base::n;
    using Base::resize;

public:
    explicit Deque(size_t capacity = 2) : Base(capacity) {}

    void enqueueFront(const T& item) {
        if (n == cap) resize(2 * cap);
        f = (f + cap - 1) % cap;                       // step left, wrapping (never % of a negative)
        data[f] = item;
        ++n;
    }
    void enqueueBack(const T& item) { this->enqueue(item); }
    T dequeueFront() { return this->dequeue(); }
    T dequeueBack() {
        if (n == 0) throw std::underflow_error("dequeueBack from an empty deque");
        T item = data[(f + n - 1) % cap];              // the last item
        --n;
        return item;
    }
    T back() const {
        if (n == 0) throw std::underflow_error("back of an empty deque");
        return data[(f + n - 1) % cap];
    }
};
```

### 13.2 main.cpp

```cpp
#include <iostream>
#include <sstream>
#include <string>

#include "linear.hpp"

// ---- Expression evaluation -------------------------------------------------
long applyOp(const std::string& op, long left, long right) {
    if (op == "+") return left + right;
    if (op == "-") return left - right;
    if (op == "*") return left * right;
    if (op == "/") {
        if (right == 0) throw std::domain_error("division by zero");
        return left / right;
    }
    throw std::invalid_argument("unknown operator " + op);
}

bool isOperator(const std::string& tok) {
    return tok == "+" || tok == "-" || tok == "*" || tok == "/";
}

// Postfix: one stack, no parentheses.
long evalPostfix(const std::string& expr) {
    LinkedStack<long> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            long v1 = s.pop();                 // right operand (popped first)
            long v2 = s.pop();                 // left operand
            s.push(applyOp(tok, v2, v1));      // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}

// Dijkstra's two-stack algorithm: fully parenthesized infix.
long evalInfix(const std::string& expr) {
    LinkedStack<long> values;
    LinkedStack<std::string> ops;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "(") continue;              // ignore
        if (isOperator(tok)) ops.push(tok);
        else if (tok == ")") {
            std::string op = ops.pop();
            long v1 = values.pop();            // right operand
            long v2 = values.pop();            // left operand
            values.push(applyOp(op, v2, v1));
        } else {
            values.push(std::stol(tok));
        }
    }
    return values.pop();
}

// Postfix back to fully parenthesized infix: push expressions, not numbers.
std::string postfixToInfix(const std::string& expr) {
    LinkedStack<std::string> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            std::string right = s.pop();
            std::string left = s.pop();
            s.push("(" + left + " " + tok + " " + right + ")");
        } else {
            s.push(tok);
        }
    }
    return s.pop();
}

// ---- Instrumentation for the cost experiments ------------------------------
struct Counted {                               // counts every assignment (element copy or shift)
    int v = 0;
    static inline long long assignments = 0;
    Counted() = default;
    Counted(const Counted&) = default;
    Counted& operator=(const Counted& o) { v = o.v; ++assignments; return *this; }
};

// Copies made by n adds starting from capacity 1 (model of the growth policy).
unsigned long long copies(size_t n, bool doubling) {
    size_t capacity = 1, size = 0;
    unsigned long long total = 0;
    for (size_t i = 0; i < n; ++i) {
        if (size == capacity) { total += size; capacity = doubling ? 2 * capacity : capacity + 1; }
        ++size;
    }
    return total;
}

int main() {
    std::cout << "== ArrayList trace ==\n";
    ArrayList<std::string> a1;
    auto row = [&](const char* call) {
        std::cout << call << "  " << a1.toString() << "  size=" << a1.size()
                  << " cap=" << a1.capacity() << '\n';
    };
    row("ArrayList a1;");
    a1.add("ICS46");        row("add(\"ICS46\")");
    a1.add("Rocks");        row("add(\"Rocks\")");
    a1.add("!");            row("add(\"!\")");
    a1.add(1, "Throws");    row("add(1, \"Throws\")");
    a1.add(3, "?");         row("add(3, \"?\")");
    for (int k = 0; k < 3; ++k) {
        std::string gone = a1.remove();
        row(("remove() -> " + gone).c_str());
    }
    try { a1.get(5); } catch (const std::out_of_range& e) { std::cout << "get(5): out_of_range: " << e.what() << '\n'; }

    std::cout << "\n== growth policy ==\n";
    for (size_t n : {17ul, 1000000ul}) {
        double d = static_cast<double>(copies(n, true) + n), p = static_cast<double>(copies(n, false) + n);
        std::cout << "n=" << n << "  doubling: " << copies(n, true) << " copies (" << d / n
                  << " per add)   +1: " << copies(n, false) << " copies (" << p / n << " per add)\n";
    }

    std::cout << "\n== singly linked list ==\n";
    SinglyLinkedList<std::string> sll;
    sll.add("ICS 46"); sll.add("ROCKS"); sll.add("!");
    sll.add(1, "?");
    std::cout << sll.toString() << " n=" << sll.size() << '\n';
    std::cout << "remove() -> " << sll.remove() << '\n';
    std::cout << "remove(1) -> " << sll.remove(1) << '\n';
    std::cout << sll.toString() << " n=" << sll.size() << '\n';
    try { sll.get(2); } catch (const std::out_of_range& e) { std::cout << "get(2): out_of_range: " << e.what() << '\n'; }

    SinglyLinkedList<std::string> s2;
    s2.add("ICS46"); s2.add("ROCKS"); s2.add("?"); s2.add("!");
    std::cout << "get(2) on " << s2.toString() << " -> " << s2.get(2) << '\n';
    s2.add("UCI");
    std::cout << "add(\"UCI\"): " << s2.toString() << " n=" << s2.size() << '\n';
    s2.remove();
    s2.add(2, "UCI");
    std::cout << "add(2, \"UCI\"): " << s2.toString() << " n=" << s2.size() << '\n';
    std::cout << "remove(2) -> " << s2.remove(2) << '\n';
    s2.add(4, "end");
    std::cout << "add(4, \"end\"): " << s2.toString() << " n=" << s2.size() << '\n';
    std::cout << "remove(4) -> " << s2.remove(4) << " (the tail), then addLast(\"again\"): ";
    s2.addLast("again");
    std::cout << s2.toString() << '\n';

    std::cout << "\n== doubly linked list ==\n";
    DoublyLinkedList<std::string> dll;
    dll.addLast("ICS 46"); dll.addFirst("ROCKS"); dll.addLast("!");
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';
    std::cout << "removeLast() -> " << dll.removeLast() << '\n';
    dll.add(1, "UCI");
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';
    std::cout << "get(1) -> " << dll.get(1) << ", remove(1) -> " << dll.remove(1) << '\n';
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';

    std::cout << "\n== memory per element ==\n";
    struct SNode { int item; SNode* next; };
    struct DNode { int item; DNode* next; DNode* prev; };
    std::cout << "SLL node " << sizeof(SNode) << " bytes, DLL node " << sizeof(DNode)
              << " bytes, ArrayList slot " << sizeof(int) << " bytes\n";

    std::cout << "\n== stacks ==\n";
    {
        LinkedStack<std::string> st;
        std::istringstream in("To be or not to - be - - that - - - is");
        std::string t;
        std::cout << "popped:";
        while (in >> t) {
            if (t == "-") std::cout << ' ' << st.pop();
            else st.push(t);
        }
        std::cout << "\nleft on stack (top first):";
        while (!st.isEmpty()) std::cout << ' ' << st.pop();
        std::cout << '\n';
    }
    {
        LinkedStack<std::string> st;
        st.push("ICS46"); st.push("ROCKS"); st.push("!");
        std::cout << "peek: " << st.peek() << ", size " << st.size() << "\npop:";
        while (!st.isEmpty()) std::cout << ' ' << st.pop();
        try { st.pop(); } catch (const std::underflow_error& e) { std::cout << "\nerror: " << e.what() << '\n'; }

        ArrayStack<std::string> as;
        as.push("ICS46"); as.push("ROCKS"); as.push("!");
        std::cout << "ArrayStack peek: " << as.peek() << ", pop:";
        while (!as.isEmpty()) std::cout << ' ' << as.pop();
        std::cout << '\n';
    }
    for (size_t n : {1000ul, 8000ul}) {
        Counted::assignments = 0;
        {
            ArrayStack<Counted> st;
            for (size_t i = 0; i < n; ++i) st.push(Counted());
        }
        long long back = Counted::assignments;
        Counted::assignments = 0;
        {
            ArrayList<Counted> list;
            for (size_t i = 0; i < n; ++i) list.add(0, Counted());
        }
        long long front = Counted::assignments;
        std::cout << "n=" << n << "  top-at-back moves=" << back << " (" << static_cast<double>(back) / n
                  << " per push)  top-at-front moves=" << front << " (" << static_cast<double>(front) / n
                  << " per push)\n";
    }

    std::cout << "\n== queues ==\n";
    {
        LinkedQueue<std::string> q;
        std::istringstream in("To be or not to - be - - that - - - is");
        std::string t;
        std::cout << "dequeued:";
        while (in >> t) {
            if (t == "-") std::cout << ' ' << q.dequeue();
            else q.enqueue(t);
        }
        std::cout << "\nleft in queue (" << q.size() << "): front = " << q.front() << '\n';

        ArrayListQueue<std::string> aq;
        aq.enqueue("ICS46"); aq.enqueue("ROCKS"); aq.enqueue("!");
        std::cout << "ArrayListQueue:";
        while (!aq.isEmpty()) std::cout << ' ' << aq.dequeue();
        std::cout << '\n';

        LinkedQueue<std::string> lq;
        lq.enqueue("ICS46"); lq.enqueue("ROCKS"); lq.enqueue("!");
        std::cout << "LinkedQueue:";
        while (!lq.isEmpty()) std::cout << ' ' << lq.dequeue();
        lq.enqueue("again");                   // after draining: head and tail were reset
        std::cout << "  then enqueue -> front = " << lq.front() << '\n';
    }

    std::cout << "\n== circular queue ==\n";
    {
        CircularQueue<int> q(2);               // capacity 2, doubled to 4
        for (int x : {1, 2, 3}) q.enqueue(x);
        std::cout << "enqueue 1 2 3   " << q.layout() << " cap=" << q.capacity() << '\n';
        q.dequeue(); q.dequeue();
        std::cout << "dequeue x2      " << q.layout() << '\n';
        q.enqueue(4); q.enqueue(5);
        std::cout << "enqueue 4 5     " << q.layout() << '\n';

        CircularQueue<char> w(5);              // wrap-around: A B C D - - E F G
        std::string ops = "ABCD--EFG";
        for (char c : ops) {
            if (c == '-') w.dequeue(); else w.enqueue(c);
        }
        std::cout << "capacity 5      " << w.layout() << " cap=" << w.capacity() << '\n';
    }

    std::cout << "\n== deque ==\n";
    {
        Deque<int> d(2);
        d.enqueueBack(1); d.enqueueBack(2); d.enqueueFront(0); d.enqueueFront(-1); d.enqueueBack(3);
        std::cout << "deque size=" << d.size() << " capacity=" << d.capacity() << " :";
        for (size_t i = 0; i < d.size(); ++i) { int x = d.dequeueFront(); std::cout << ' ' << x; d.enqueueBack(x); }
        std::cout << "\nfront=" << d.front() << " back=" << d.back() << '\n';
        std::cout << "dequeued: " << d.dequeueFront() << ' ' << d.dequeueBack();
        while (!d.isEmpty()) std::cout << ' ' << d.dequeueFront();
        std::cout << '\n';
    }

    std::cout << "\n== expressions ==\n";
    std::cout << "infix  ( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) ) = " << evalInfix("( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )") << '\n';
    std::cout << "infix  ( ( 2 + 3 ) * ( 4 * 5 ) ) = " << evalInfix("( ( 2 + 3 ) * ( 4 * 5 ) )") << '\n';
    std::cout << "infix  ( 10 - 4 ) = " << evalInfix("( 10 - 4 )") << '\n';
    for (const char* e : {"52 5 7 + 4 * -", "5 1 2 + 4 * + 3 -", "10 4 -"})
        std::cout << "postfix  " << e << " = " << evalPostfix(e) << '\n';
    std::cout << "5 1 2 + 4 * + 3 - as infix: " << postfixToInfix("5 1 2 + 4 * + 3 -") << '\n';
}
```

### 13.3 输出

```text
== ArrayList trace ==
ArrayList a1;  []  size=0 cap=2
add("ICS46")  [ICS46]  size=1 cap=2
add("Rocks")  [ICS46, Rocks]  size=2 cap=2
add("!")  [ICS46, Rocks, !]  size=3 cap=4
add(1, "Throws")  [ICS46, Throws, Rocks, !]  size=4 cap=4
add(3, "?")  [ICS46, Throws, Rocks, ?, !]  size=5 cap=8
remove() -> !  [ICS46, Throws, Rocks, ?]  size=4 cap=8
remove() -> ?  [ICS46, Throws, Rocks]  size=3 cap=8
remove() -> Rocks  [ICS46, Throws]  size=2 cap=4
get(5): out_of_range: index 5

== growth policy ==
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)

== singly linked list ==
[!, ?, ROCKS, ICS 46] n=4
remove() -> !
remove(1) -> ROCKS
[?, ICS 46] n=2
get(2): out_of_range: index 2
get(2) on [!, ?, ROCKS, ICS46] -> ROCKS
add("UCI"): [UCI, !, ?, ROCKS, ICS46] n=5
add(2, "UCI"): [!, ?, UCI, ROCKS, ICS46] n=5
remove(2) -> UCI
add(4, "end"): [!, ?, ROCKS, ICS46, end] n=5
remove(4) -> end (the tail), then addLast("again"): [!, ?, ROCKS, ICS46, again]

== doubly linked list ==
[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS] n=3
removeLast() -> !
[ROCKS, UCI, ICS 46] backwards [ICS 46, UCI, ROCKS] n=3
get(1) -> UCI, remove(1) -> UCI
[ROCKS, ICS 46] backwards [ICS 46, ROCKS] n=2

== memory per element ==
SLL node 16 bytes, DLL node 24 bytes, ArrayList slot 4 bytes

== stacks ==
popped: to be not that or be
left on stack (top first): is To
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from an empty stack
ArrayStack peek: !, pop: ! ROCKS ICS46
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)

== queues ==
dequeued: To be or not to be
left in queue (2): front = that
ArrayListQueue: ICS46 ROCKS !
LinkedQueue: ICS46 ROCKS !  then enqueue -> front = again

== circular queue ==
enqueue 1 2 3   [1 2 3 _] f=0 n=3 cap=4
dequeue x2      [_ _ 3 _] f=2 n=1
enqueue 4 5     [5 _ 3 4] f=2 n=3
capacity 5      [F G C D E] f=2 n=5 cap=5

== deque ==
deque size=5 capacity=8 : -1 0 1 2 3
front=-1 back=3
dequeued: -1 3 0 1 2

== expressions ==
infix  ( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) ) = 101
infix  ( ( 2 + 3 ) * ( 4 * 5 ) ) = 100
infix  ( 10 - 4 ) = 6
postfix  52 5 7 + 4 * - = 4
postfix  5 1 2 + 4 * + 3 - = 14
postfix  10 4 - = 6
5 1 2 + 4 * + 3 - as infix: ((5 + ((1 + 2) * 4)) - 3)
```
## 14. 速查与五个要点

| 操作 | ArrayList | SLL | SLL + tail | DLL | 基于 ArrayList 的栈（栈顶在末端） |
|---|---|---|---|---|---|
| 按下标访问 | O(1) | O(n) | O(n) | O(n) | — |
| 在前端添加 / 删除 | O(n) | O(1) | O(1) | O(1) | — |
| 在末尾添加 | O(1) 均摊 | O(n) | O(1) | O(1) | push：O(1) 均摊 |
| 在末尾删除 | O(1) 均摊 | O(n) | O(n) | O(1) | pop：O(1) 均摊 |
| 按下标添加 / 删除 | O(n) | O(n) | O(n) | O(n) | — |
| 查看（peek） | — | — | — | — | O(1) |

| ADT | 顺序 | 添加 / 删除 / 查看 | 最佳链表 | 两端位置 | 代价 |
|---|---|---|---|---|---|
| 栈 | LIFO | push / pop / peek | 仅 head 的单链表 | 栈顶 = head | O(1) 最坏情况 |
| 队列 | FIFO | enqueue / dequeue / front | head + tail 的单链表 | front = head，rear = tail | O(1) 最坏情况 |
| 基于 ArrayList 的栈 | LIFO | push / pop / peek | — | 栈顶 = 末端 | O(1) 均摊（“阶跃式”） |
| 基于 ArrayList 的队列 | FIFO | enqueue / dequeue | — | front = 下标 0 | dequeue 为 O(n) |
| 循环数组队列 / 双端队列 | FIFO / 两端 | enqueue / dequeue | — | front 移动，用 `%` 回绕 | O(1)（若扩容则为均摊） |

ArrayList 扩容策略：默认容量为 2；满时 ×2；¼ 满时 ×½。若改为每次只增加固定的 1 个单元，则每次 `add` 的均摊代价为 Θ(n)。

**需要牢记的五件事**

1. 由于**遍历**，每一个带下标的链表操作都是 O(n)；拼接本身是 O(1)。在 SLL 中间插入或删除需要**前驱**节点，而下标 0 比较特殊，因为它会改变 `head`。DLL 的 `prev` 使尾部删除为 O(1)；SLL 即使有尾指针，尾部删除仍为 O(n)。
2. ArrayList 在末尾的 `add` / `remove` 是**均摊** O(1)（翻倍，¼ 满时缩容），但最坏情况为 O(n)；在前端或中间则因移位而为 O(n)。每次增加固定数量的扩容，每次 add 的均摊代价为 Θ(n)。
3. 链表实现的栈把**栈顶放在头部**（push、pop、peek 的最坏情况都是 O(1)）；ArrayList 实现的栈把栈顶放在**末端**（O(1) 均摊，“阶跃式”）；放错一端则代价为 O(n)。
4. 基于 SLL 的队列需要一个 **tail** 指针，并且必须**在尾部入队、在头部出队**；普通的 ArrayList 队列总有一种操作为 O(n)，因此应使用循环数组（保存前端下标与计数，并用 `%` 回绕）。同样的结构可以扩展为双端队列。
5. **第一个弹出的值是右操作数**：计算 `v2 op v1`（对 `-` 与 `/` 很重要）；后缀只需一个栈且不需要括号，完全加括号的中缀则需要 Dijkstra 的双栈。在 `delete` **之前**取出元素副本，并在每个修改操作中更新 `n`。