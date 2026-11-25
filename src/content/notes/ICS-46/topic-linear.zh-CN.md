---
title: "列表、栈与队列"
summary: "线性结构：ArrayList 及其均摊扩容，单向与双向链表，栈与队列 ADT 及其数组和链表实现，循环数组与双端队列，以及用栈求值表达式。"
topics:
  - linear
kind: "topic"
order: 503
---

# 信息与计算机科学 46 — 话题：列表、栈与队列

## 目录

- [1. 线性结构、ADT 与数据结构](#1-线性结构adt-与数据结构)
- [2. ArrayList（动态数组）](#2-arraylist动态数组)
- [3. 扩容与均摊分析](#3-扩容与均摊分析)
- [4. 单向链表](#4-单向链表)
- [5. 双向链表](#5-双向链表)
- [6. ArrayList 与链表的比较](#6-arraylist-与链表的比较)
- [7. 栈](#7-栈)
- [8. 队列](#8-队列)
- [9. 循环数组队列](#9-循环数组队列)
- [10. 双端队列](#10-双端队列)
- [11. 栈的应用：表达式求值](#11-栈的应用表达式求值)
- [12. 队列的应用](#12-队列的应用)
- [13. 速查与五个要点](#13-速查与五个要点)

> UCI ICS 46：数据结构的实现与分析 — Tom Yeh 教授。本笔记把第 3–7 讲中的列表、栈与队列内容汇集在一起，按概念组织。

## 1. 线性结构、ADT 与数据结构

### 1.1 为什么需要数据结构？

数据结构**组织并存储数据**，使所需的操作足够高效（就像一座没有分类的图书馆与一座分好类的图书馆之别）。它的好坏用**时间**和**空间**复杂度来衡量，而且**没有一种放之四海而皆准的结构**——这正是有这么多数据结构的原因。

典型操作包括：**插入、删除、查找、替换**，以及**遍历、排序、判空**。没有哪一种结构能高效地完成所有操作；选择取决于你的数据、需要哪些操作（以及使用的频率），还取决于技术限制（内存、实时性）。

**线性与非线性：**

| 线性（序列；每个元素都有前驱和后继） | 非线性（层次化 / 相互连接） |
|---|---|
| 连续存储：数组、ArrayList（[§2](#2-arraylist动态数组)） | 树：二叉树、BST |
| 基于指针：单向与双向链表（[§4](#4-单向链表)、[§5](#5-双向链表)） | 图：节点与边 |
| 顺序访问：栈、队列（[§7](#7-栈)、[§8](#8-队列)） | 非连续内存，非顺序遍历 |

非线性部分见 [树与遍历](topic-trees.zh-CN.md)。

### 1.2 ADT 与数据结构

讲义把集合**做什么**与**如何构造**分开来讲。

- **抽象数据类型（ADT）**是*做什么*：存储哪些数据，存在哪些操作。它是一份行为契约，不涉及内存布局。
- **数据结构（DS）**是*怎么做*：数据如何组织、存储和操作。它关心内存布局、效率，以及每个操作背后的算法。

| ADT（"做什么"） | 操作 | 实现它的数据结构（"怎么做"） |
|---|---|---|
| 列表 | 对有序集合执行 `add()`、`remove()`、`get()` | ArrayList（动态扩容的数组）、LinkedList（节点指针） |
| 栈 | LIFO：`push()`、`pop()`、`peek()` | 基于数组的栈、链式栈（单向链表节点） |
| 队列 | FIFO：`enqueue()`、`dequeue()` | 循环数组（环形缓冲区）、链式队列（头尾指针） |

例：「一个 Stack」指的是 ADT；「以 head 为栈顶的链式栈」则是实现它的一种数据结构。它的 `push` 是 O(1)，是因为*数据结构*，而不是因为 ADT。

## 2. ArrayList（动态数组）

### 2.1 状态

ArrayList（可变长 / 动态数组）是一种**从 0 开始编号的线性结构**，存放在**连续内存**中，底层由一个**具有一定容量的数组**支撑。与数组一样，它按下标访问是 **O(1)**。它保存三样东西：**元素数组**、**大小**（元素个数）和**容量**（已分配的长度）。它自动分配和释放内存，只使用前 `size` 个单元；数组满了，就分配一个更大的数组，并把所有元素复制过去。它与 `std::vector` 相对应。

下图的容量为 8、大小为 3；虚线格子已分配但未使用：

```viz arraylist
{"title": "容量 8，大小 3", "ops": "add(ICS46); add(ROCKS); add(!)", "capacity": 8, "start": 7, "code": "none"}
```


不变式：**size ≤ capacity**；`[size, capacity)` 中的单元不存放有意义的内容。

### 2.2 接口

| 分组 | 操作 | 含义 |
|---|---|---|
| 构造函数 | `ArrayList()` | 空表，**初始容量为 2** |
| | `ArrayList(int capacity)` | 空表，指定容量 |
| 查询 | `isEmpty()`、`size()`、`at(int index)` | 是否为空？元素个数？下标处的元素 |
| 修改 | `add(Item item)` | 追加到末尾 |
| | `add(int index, Item item)` | 插入，后面的元素右移 |
| | `Item remove()` | 删除并返回最后一个元素 |
| | `Item remove(int index)` | 删除指定位置的元素，后面的元素左移 |
| | `set(int index, Item item)` | 替换指定位置的元素 |

下面的跟踪使用 `std::string` 版本（`void add(const std::string& s)`）。

### 2.3 跟踪

每一步都添加一行；在阅读该行之前，先预测内容、大小和容量：

| 步骤 | 调用 | 内容 | 大小 | 容量 | 发生了什么 |
|---|---|---|---|---|---|
| 1 | `ArrayList a1;` | — | 0 | 2 | 默认容量为 2 |
| 2 | `a1.add("ICS46");` | ICS46 | 1 | 2 | 存入下标 size 处 |
| 3 | `a1.add("Rocks");` | ICS46, Rocks | 2 | 2 | 现在满了 |
| 4 | `a1.add("!");` | ICS46, Rocks, ! | 3 | **4** | 满 → 翻倍、复制，然后加入 |
| 5 | `a1.add(1, "Throws");` | ICS46, Throws, Rocks, ! | 4 | 4 | Rocks、! 右移 |
| 6 | `a1.add(3, "?");` | ICS46, Throws, Rocks, ?, ! | 5 | **8** | 满 → 翻倍、右移、加入 |
| 7 | `a1.remove();` | ICS46, Throws, Rocks, ? | 4 | 8 | 返回 `!` |
| 8 | `a1.remove();` | ICS46, Throws, Rocks | 3 | 8 | 返回 `?` |
| 9 | `a1.remove();` | ICS46, Throws | 2 | **4** | 返回 `Rocks`；2/8 = ¼ 满 → 减半 |

用[完整实现](#26-完整实现)运行这个程序会得到相同的状态（之后 `a1.at(5)` 会抛出 `out_of_range: index 5`）。

整个跟踪过程每次只移动一个元素——在下面的演示框中尝试你自己的调用。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz arraylist
{"title": "ArrayList 跟踪", "ops": "add(ICS46); add(Rocks); add(!); add(1, Throws); add(3, ?); remove(); remove(); remove()", "interactive": true}
```


> ⚠️ **易错点**：幻灯片的错误（幻灯片上的跟踪）：其中一步的标题写着 `remove()`，但所显示的步骤却是 `a1.add(3, "?")`（标题是从下一步带过来的）。

### 2.4 扩容做了什么

在已满的数组上执行 `add` 时，会先分配容量翻倍的新数组，复制全部 n 个元素（**Θ(n) 的那一部分**），释放旧数组，把 `data_` 指向新数组，然后才存入元素。指针的改变才是这里的重点，所以完整演示一次：在容量为 2 且已满的数组上执行 `a1.add("!")`（演示一开始就会触发扩容）。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz arraylist
{"title": "在满的 ArrayList 上执行 add", "ops": "add(ICS46); add(Rocks); add(!)", "start": 7}
```


`add(index, item)` 则是把 `data_[index..n-1]` **从后往前**逐个右移一格（`for (size_t i = n_; i > index; --i) data_[i] = data_[i-1];`），这样在移动之前不会覆盖任何元素；`remove(index)` 则是从前往后左移。

> ⚠️ **易错点**：要**先**复制，然后 `delete[]`，最后再重新赋值——先删除会丢失数据，先重新赋值则会泄漏旧缓冲区。

### 2.5 运行时间

| 操作 | 最坏情况 | 均摊 |
|---|---|---|
| `isEmpty`、`size`、`at`、`set` | O(1) | — |
| `add(x)`（末尾） | O(n) | **O(1)** |
| `remove()`（末尾） | O(n)（带缩容） | O(1) |
| `add(i, x)`、`remove(i)` | O(n)（移位） | O(n) |

在末尾和随机访问时很快，在头部和中间则很慢——链表（[§4](#4-单向链表)）做出了相反的取舍。

### 2.6 完整实现

```cpp
#include <cstddef>
#include <stdexcept>
#include <string>
#include <utility>

template <typename T>
class ArrayList {
public:
    ArrayList() : ArrayList(2) {}                       // initial capacity 2
    explicit ArrayList(size_t capacity)
        : data_{new T[capacity > 0 ? capacity : 1]},
          capacity_{capacity > 0 ? capacity : 1}, n_{0} {}

    // Rule of three: we own data_, so copying must copy the buffer.
    ~ArrayList() { delete[] data_; }
    ArrayList(const ArrayList& other)
        : data_{new T[other.capacity_]}, capacity_{other.capacity_}, n_{other.n_} {
        for (size_t i = 0; i < n_; ++i) data_[i] = other.data_[i];
    }
    ArrayList& operator=(ArrayList other) {             // copy-and-swap
        std::swap(data_, other.data_);
        std::swap(capacity_, other.capacity_);
        std::swap(n_, other.n_);
        return *this;
    }

    bool isEmpty() const { return n_ == 0; }
    size_t size() const { return n_; }
    size_t capacity() const { return capacity_; }

    const T& at(size_t index) const { rangeCheck(index); return data_[index]; }

    void set(size_t index, const T& item) { rangeCheck(index); data_[index] = item; }

    void add(const T& item) {                          // append at the end
        if (n_ == capacity_) resize(2 * capacity_);
        data_[n_++] = item;
    }

    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n_) throw std::out_of_range("add: index " + std::to_string(index));
        if (n_ == capacity_) resize(2 * capacity_);
        for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];
        data_[index] = item;
        ++n_;
    }

    T remove() {                                       // remove from the end
        if (n_ == 0) throw std::out_of_range("remove from empty ArrayList");
        T item = data_[--n_];
        shrinkIfSparse();
        return item;
    }

    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data_[index];
        for (size_t i = index; i + 1 < n_; ++i) data_[i] = data_[i + 1];
        --n_;
        shrinkIfSparse();
        return item;
    }

private:
    T* data_;
    size_t capacity_;
    size_t n_;

    void rangeCheck(size_t index) const {
        if (index >= n_) throw std::out_of_range("index " + std::to_string(index));
    }
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (capacity_ > 1 && n_ <= capacity_ / 4) resize(capacity_ / 2);
    }
    void resize(size_t newCapacity) {
        T* bigger = new T[newCapacity];
        for (size_t i = 0; i < n_; ++i) bigger[i] = data_[i];
        delete[] data_;
        data_ = bigger;
        capacity_ = newCapacity;
    }
};
```


### 2.7 练习

#### ArrayList 跟踪：会发生什么？

从 `ArrayList a1;` 开始，预测依次执行 `add("ICS46")`、`add("Rocks")`、`add("!")`、`add(1, "Throws")`、`add(3, "?")`，然后三次 `remove()` 之后的内容、大小和容量。

<details>
<summary>解答</summary>

1/2 → 2/2（满）→ `!` 触发翻倍：3/4 → Throws 使 Rocks、! 右移：4/4 → `?` 触发翻倍至 8，`!` 右移：[ICS46, Throws, Rocks, ?, !] 5/8 → 三次删除依次返回 `!`、`?`、`Rocks`；在 2/8 = ¼ 容量时减半：[ICS46, Throws] 2/4。表格见 [§2.3](#23-跟踪)。

</details>

## 3. 扩容与均摊分析

### 3.1 策略与最坏情况

| | 扩容 | 缩容 |
|---|---|---|
| 触发条件 | 向**已满**的列表添加元素 | 列表降至 **¼ 满** |
| 操作 | 容量 × 2 | 容量 × ½ |
| 代价 | 复制所有元素 | 复制所有元素 |

**关键问题：** `add()` 的最坏情况是什么？**代价模型：** 插入计 1，复制 n 个元素计 n。因此一次 `add` 平时代价为 1，扩容时代价为 n + 1：**最坏情况 O(n)**。但对于一连串的 add 来说，这个估计过于悲观——因此需要均摊分析。

> 📘 **课外补充**：缩容的阈值取 ¼（而非 ½）是为了避免抖动——若取 ½，在边界处交替执行 add/remove 就会在每次调用时都触发 Θ(n) 的扩缩容。

### 3.2 均摊代价

**每次操作的均摊代价** = 一串 n 次操作的总代价 ÷ n。常用方法有：**聚合法**（约束总代价 T(n)，再除以 n——本讲采用此法）、**记账法**（为每次操作收取固定费用，并存入余额）、**势能法**（用势能函数存储"能量"）。

> 💡 **关键洞见**：均摊 ≠ 平均情况。这里不涉及概率：它是对任意操作序列**总代价**的最坏情况保证。

### 3.3 加倍与每次加一

从容量 1 开始调用 n 次 `add`。数组已满时，第 (k+1) 次 add 会复制 k 个元素：

| k | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |
|---|---|---|---|---|---|---|---|---|---|
| 复制代价，×2 | 0 | 1 | 2 | 0 | 4 | 0 | 8 | 0 | 16 |
| 复制代价，+1 | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |

（每一列中插入代价都是 1；总代价 = 插入 + 复制。）

注意每次加一时，复制的代价是如何不断堆积的——在脑中把 `growth` 换成加倍，再与表格对比。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz arraylist
{"title": "每次加一：第一次之后的每次 add 都要复制全部元素", "ops": "add(A); add(B); add(C); add(D); add(E); add(F)", "capacity": 1, "growth": "plus1"}
```


- **加倍：** 复制次数 $= 1 + 2 + 4 + \dots + 2^{\lfloor \log_2 n \rfloor} \le 2n$（等比，公比为 2），插入次数 $= n$，总计 $\le 3n$ → **均摊 O(1)**，但"时快时慢"：扩容次数减半，而每次的代价翻倍。
- **+1：** 总计 $= n + (0 + 1 + \dots + (n-1)) = n + n(n-1)/2 = \Theta(n^2)$ → **均摊 Θ(n)**。

测得的元素复制次数（初始容量为 1）：

```text
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)
```


> ⚠️ **易错点**：要说 "`add` 是**均摊** O(1)，**最坏情况** O(n)"——漏掉"均摊"二字就是错的。

> 📘 **课外补充**（Thornton）：均摊 O(1) 对总时间来说没问题，但当*每一次*操作都有时限时（实时控制、60 fps 的游戏）就不行了——一次 O(n) 的扩容就等于错过一帧。

### 3.4 练习

#### 均摊分析：每次加一

如果只在数组已满时加 1 个元素，那么 ArrayList 的 `add()` 的均摊时间复杂度是多少？

<details>
<summary>解答</summary>

**每次 add 为 Θ(n)。** 每次 add 之前数组都是满的，因此第 (k+1) 次 add 要复制 k 个元素：总计 $n + n(n-1)/2 = \Theta(n^2)$，再除以 n。若采用加倍，总计 ≤ 3n，均摊 O(1)。

</details>

## 4. 单向链表

### 4.1 用指针连接的节点

ArrayList 把元素保存在一整块连续的内存中。**链表**同样是动态线性结构，但每个元素都位于自己堆上的**节点**中，顺序则由节点之间的**指针**记录——节点可以散落在内存的任何位置。在编号为 0–7 的内存单元示意图中，列表 "CS ? !" 从单元 3（**头节点**）开始，单元 3 指向单元 1，单元 1 指向单元 6；其他单元不属于该列表。

递归定义：单向链表**要么为空（`nullptr`），要么是一个节点，它保存一个元素以及一个指向单向链表的指针**。`Node<T>` 保存一个 `T` 类型的元素和一个指向下一个节点的链接。最后一个节点的 `next` 为 `nullptr`（即常见盒式图中的斜线）。

```viz linked-list
{"title": "走到最后一个节点需要逐个走过", "items": "CS, ?, !", "ops": "get(2)", "start": 1}
```


> 📘 **课外补充**（algs4 §1.3）：递归定义给出了标准的遍历循环 `for (Node* x = head; x != nullptr; x = x->next)`，你在打印、析构函数和复制时都会用到它。

### 4.2 接口与一个示例序列

`SinglyLinkedList<T>` 的接口：`SinglyLinkedList()`、`bool isEmpty() const`、`size_t size() const`、`T get(size_t index) const`、`void add(const T& item)`（**在头部**）、`void add(size_t index, const T& item)`、`T remove()`（**删除头节点**）、`T remove(size_t index)`。注意，不带下标的 `add`/`remove` 作用于**头部**，与 ArrayList 正好相反。

一个示例序列（下标从头部开始，从 0 计数）：

| 步骤 | 调用 | 之后的列表 | `n` |
|---|---|---|---|
| 1 | `SinglyLinkedList<std::string> sll;` | 空 | 0 |
| 2–4 | `add("ICS 46")`、`add("ROCKS")`、`add("!")` | ! → ROCKS → ICS 46 | 3 |
| 5 | `add(1, "?")` | ! → ? → ROCKS → ICS 46 | 4 |
| 6 | `remove()` 返回 "!" | ? → ROCKS → ICS 46 | 3 |
| 7 | `remove(1)` 返回 "ROCKS" | ? → ICS 46 | 2 |

在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz linked-list
{"title": "单向链表：add 与 remove", "ops": "add(ICS 46); add(ROCKS); add(!); add(1, ?); remove(); remove(1)", "interactive": true}
```


头插意味着元素按插入的**逆序**取出——这正是 LIFO，也就是 [§7](#7-栈) 中栈的行为。

### 4.3 类的结构

计划是：我们自己的链表，一个**模板**，一个**嵌套类 `Node`**，以及一个**元素计数**。

```cpp
template <typename T>
class SinglyLinkedList {
private:
    /**
     * Defines the nodes of the singly linked list. Each node holds
     * a value and a pointer to the next node.
     */
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };

    Node* head;         // Pointer to the first node
    std::size_t n;      // Number of elements in the list

public:
    SinglyLinkedList() : head(nullptr), n(0) {}
    ~SinglyLinkedList();

    // Rule of Five: also define copy ctor, copy assign,
    // move ctor, move assign

    // isEmpty, size, get, add, remove ...
};
```


把 `n` 存下来，使 `size()` 为 O(1)，代价是每个修改操作都必须更新它。`Node` **没有默认构造函数**——这对下面幻灯片中的两处错误很重要。

```cpp
bool isEmpty() const {
    return head == nullptr; // return size() == 0;
}

size_t size() const {
    return n;
}
```


只要不变式 **`head == nullptr` 当且仅当 `n == 0`** 成立，两个 `isEmpty` 版本就是一致的。析构函数通过不断删除头节点来释放每个节点；复制和移动操作同样必要——编译器默认生成的复制会让两个对象共享同一条链，并造成重复释放。

### 4.4 rangeCheck

```cpp
void rangeCheck(size_t index) const {
    if (index > n || index < 0)
        throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
}
```


> ⚠️ **易错点**：在 `size_t` 上 `index < 0` 永远为假，而 `index > n` 会放过 `index == n`，因此 `get(n)` 会解引用 `nullptr` → 对 `get`/`remove` 应使用 `if (index >= n)`；`add(index, item)` 允许 `index == n`（追加），并自行检查 `index > n`。

示例（已编译）：在一个有 2 个元素的列表上，`get(2)` 会打印 `get(2): Index 2 out of bounds`。

### 4.5 get(index)：用手指遍历

链表中唯一能直接到达的节点是头节点，因此放一个临时指针——**finger（手指）**——指向它，然后向前移动 `index` 次：

```cpp
T get(size_t index) {
    // Check whether index is valid
    rangeCheck(index);

    // Start from head of list
    Node* finger = head;

    // Move forward 'index' times
    while (index > 0) {
        finger = finger->next;
        index--;
    }

    // return the item in the node at position 'index'
    return finger->item;
}
```


示例：在 ! → ? → ROCKS → ICS46 上执行 `get(2)`，finger 依次经过 "!" → "?" → "ROCKS"，并返回 "ROCKS"。最多移动 `n - 1` 步，因此是 **O(n)**。

> ⚠️ **易错点**：幻灯片上的 `get` 缺少 `const`（API 写的是 `T get(size_t index) const`）→ 要加上 `const`，否则无法在 `const` 列表上调用 `get`。

### 4.6 add(item)：在头部插入

让新节点指向当前的第一个节点，然后让 `head` 指向新节点：

```cpp
void add(const T& item) {
    Node* oldHead = head;                 // remember the current first node
    Node* newNode = new Node(item);       // allocate node (next defaults to nullptr)
    newNode->next = oldHead;              // link new node to the old head
    head = newNode;                       // new node becomes the head
    ++n;                                  // increase number of nodes
}
```


示例：在 ! → ? → ROCKS → ICS46 上执行 `add("UCI")`，得到 `[UCI, !, ?, ROCKS, ICS46] n=5`。没有循环 → **O(1)**，对空链表也成立（此时 `oldHead` 为 `nullptr`）。

> ⚠️ **易错点**：要先链接，再移动 `head`。若先写 `head = newNode;`，就丢失了指向旧链表的唯一指针。`head = new Node(item, head);` 一行即可同时完成两件事。

### 4.7 add(index, item)：在指定位置插入

要在 ! → ? → ROCKS → ICS46 的索引 2 处插入 "UCI"，需要改变的指针是 **"?" 的 `next`**——也就是插入位置*之前*的那个节点。因此要同时走两个指针：`finger` 停在当前位于 `index` 的节点上，`previous` 始终落后一步。对于 `add(2, …)`，指针对 (`previous`, `finger`) 依次为 (nullptr, "!") → ("!", "?") → ("?", "ROCKS")，然后停止。

```cpp
void add(int index, const T& item) {
        // check that index is within range
    rangeCheck(index);
        // if index is 0, then call one-argument add
    if (index == 0) {
        add(item);
        // else
    } else {
        // make two pointers, previous and finger. Point previous to null and finger to head
        Node* previous = nullptr;
        Node* finger = head;
        // search for index-th position by pointing previous to finger and advancing finger
        while (index > 0 && finger != nullptr) {
            previous = finger;
            finger = finger->next;
            index--;
        }
        // create new node to insert in correct position. Set its pointers and contents
        Node* current = new Node();
        current->next = finger;
        current->item = item;
        // make previous point to newly created node.
        previous->next = current;
        // increase number of nodes
        n++;
    }
}
```


> ⚠️ **易错点**：`new Node()` 无法编译（`Node` 没有默认构造函数）→ 应写 `Node* current = new Node(item, finger);`。另外 `int index` 应改为 `size_t`，范围检查必须允许 `index == n`。

索引 0 是特殊情况：此时 `previous` 仍为 `nullptr`，而且在最前面插入改变的是 `head`，而不是某个节点的 `next`。下面用修正后的代码，展示从遍历到拼接的过程：

```viz linked-list
{"title": "在索引 2 处插入 UCI", "items": "!, ?, ROCKS, ICS46", "ops": "add(2, UCI)"}
```


示例（已编译）：`add(2, "UCI")` → `[!, ?, UCI, ROCKS, ICS46] n=5`；在 4 个元素的列表上执行 `add(4, "end")` 则是追加 → `[!, ?, ROCKS, ICS46, end] n=5`。最多走 `n` 步 → **O(n)**。

### 4.8 remove()：删除头节点

把 `head` 右移一个节点，然后删除原来的第一个节点：

```cpp
T remove() {
    // Make a temporary pointer to head
    Node* temp = head;
    // Move head one to the right
    head = head->next;
    // Decrease number of nodes
    n--;

    // Delete old head node
    T data = temp->data;
    delete temp;
    return data;
}
```


> ⚠️ **易错点**：`temp->data` / `finger->data`——字段名叫 `item`，应写 `T data = temp->item;`。

先把元素复制出来，**然后**再 `delete`，最后返回副本——`delete` 之后 `temp` 就成了悬空指针。示例：在 ! → ? → ROCKS → ICS 46 上执行 `remove()` 返回 "!"。**O(1)**。（在空链表上它会解引用 `nullptr`；[完整实现](#54-完整实现sll-和-dll)会先抛出异常。）

### 4.9 remove(index)：删除指定位置

与 `add(index, item)` 的遍历相同；等 `finger` 落到要删除的节点上之后，让 `previous` 跳过它。完整的方法就是下面 [按索引删除的练习](#实现按索引删除) 的解答（用 `item` 代替幻灯片上的 `finger->data`）。

`remove(2)` 作用于 ! → ? → ROCKS → ICS46：遍历、跳过、删除。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz linked-list
{"title": "remove(2)", "items": "!, ?, ROCKS, ICS46", "ops": "remove(2)"}
```


示例（已编译）：在 ! → ? → UCI → ROCKS → ICS46 上执行 `remove(2)` 返回 "UCI"。遍历 → **O(n)**。

### 4.10 每个操作的代价

问题始终是：在做常数时间的指针操作之前，必须走过多少个节点？

| 操作 | 最坏情况 | 原因 |
|---|---|---|
| 在头部 `add(item)` | **O(1)** | 没有循环 |
| `get(index)` | **O(n)** | 最多走 `n - 1` 步 |
| `add(index, item)` | **O(n)** | 先遍历，再 O(1) 拼接 |
| 在头部 `remove()` | **O(1)** | 移动 `head`，删除一个节点 |
| `remove(index)` | **O(n)** | 先遍历，再 O(1) 跳过 |
| 在尾部 add / remove（只有 head） | **O(n)** | 要走到末尾（删除还需要倒数第二个节点） |

较早版本的 `add` 给 `first = new Node();` 赋值，并设置 `first->item`、`first->next = oldHead`。

> ⚠️ **易错点**：幻灯片的错误（幻灯片上的代码）：残留的 `first`（并不是成员；`head` 从未被更新），以及 `new Node()` → 请使用 [§4.6](#46-additem在头部插入) 中的 `add(item)` 版本；结果仍然是 O(1)。
> ⚠️ **易错点**：幻灯片上的 `public T get(int index)` 是 Java 的残留 → 在 C++ 中，访问权限由 `public:` 标签决定。

> 📘 **课外补充**（Thornton，Linked List Variations）：`get(i)` 实际上是 **Θ(i)**——`get(0)` 在任何链表上都很快。"O(n)" 是对所有 `i` 取的最坏情况。

### 4.11 尾指针有帮助吗？

增加一个 `Node* tail` 成员，指向最后一个节点：

- **在尾部添加 → O(1)**：`tail->next = newNode; tail = newNode;`（若为空链表，还要设置 `head`）。
- **在尾部删除 → 仍是 O(n)**：你需要*倒数第二个*节点来把它的 `next` 设为 `nullptr`，而单向链表无法从 `tail` 向后退。

> 💡 **关键洞见**：在单向链表中，指向某个节点的指针只能改变它**之后**的内容，无法改变它**之前**的内容。

### 4.12 练习

#### 实现按索引删除

完成 `else` 分支（图中显示 ! ? ROCKS ICS46，下方标有 `previous` 和 `finger`）：

```cpp
//Retrieves and removes the item at the specified index.
T remove(int index) {
        // check that index is within range
    rangeCheck(index);
        // if index is 0, then call remove
    if (index == 0) {
        return remove();
        // else
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
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = finger->next;    // bypass the node
        n--;
        T data = finger->item;            // copy out BEFORE delete
        delete finger;
        return data;
```


只有被删节点*之前*那个节点的 `next` 需要改变，因此需要 `previous`；索引 0 要单独处理，因为此时需要改变的指针是 `head`。

</details>

#### 单向链表操作的时间复杂度

填写最坏情况：`add(E item)`——在头部插入为 O(1)，在尾部插入为 O( )；`get(int index)`——O( )；`add(int index, T item)`——O( )；`remove()`——从头部删除为 O( )，从尾部删除为 O( )；`remove(int index)`——O( )。

<details>
<summary>解答</summary>

在尾部添加 **O(n)**（有尾指针则为 O(1)）；`get` **O(n)**；`add(index)` **O(n)**；从头部删除 **O(1)**，从尾部删除 **O(n)**（即使有尾指针也一样——无法回到倒数第二个节点）；`remove(index)` **O(n)**。

</details>

## 5. 双向链表

### 5.1 节点与头尾指针

**双向链表（DLL）**给每个节点再加一个指向前一个节点的指针：

```cpp
class Node {
    T item;
    Node* next;
    Node* prev;
};
```


各操作直接点明它作用的一端：`DoublyLinkedList()`、`isEmpty()`、`size()`、`get(int index)`、`addFirst(Item item)`、`addLast(Item item)`、`add(int index, Item item)`、`Item removeFirst()`、`Item removeLast()`、`Item remove(int index)`（`Item`/`int` 是幻灯片上的命名；在我们的 C++ 中是 `T`/`size_t`）。列表保存一个**头**（Head/Beginning/Front/First）和一个**尾**（Tail/End/Back/Last）。

按顺序阅读的五张小图，展示了列表先增长后缩小的过程：

| 图 | 节点 | head | tail |
|---|---|---|---|
| 1 | ICS 46（`prev` 和 `next` 都为空） | ICS 46 | ICS 46（同一个节点） |
| 2 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 3 | ROCKS ⇄ ICS 46 ⇄ ! | ROCKS | ! |
| 4 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 5 | ICS 46 | ICS 46 | ICS 46 |

一串能依次产生这五种状态的操作。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz doubly-linked-list
{"title": "五个 DLL 状态", "ops": "addLast(ICS 46); addFirst(ROCKS); addLast(!); removeLast(); removeFirst()", "interactive": true}
```


只有一个节点的状态是边界情况：此时 `head == tail`，因此在空链表上添加，或删除最后一个节点时，**两者**都必须更新。

### 5.2 两端都是 O(1)（我的补全）

讲义给出的是接口和图示，而没有 DLL 代码；以下是我的补全（已编译；`addLast`/`addFirst`/`removeFirst` 见 [§5.4](#54-完整实现sll-和-dll)）：

```cpp
T removeLast() {                               // O(1) thanks to prev
    if (isEmpty()) throw std::out_of_range("removeLast() on empty list");
    Node* old = tail;
    tail = tail->prev;                          // second-to-last, one step away
    if (tail != nullptr) tail->next = nullptr; else head = nullptr;
    T data = old->item;
    delete old;
    --n;
    return data;
}
```


在中间插入会修改**四个**链接（新节点的 `prev` 和 `next`、`before->next`、`after->prev`）；删除中间节点 `x` 则是 `x->prev->next = x->next; x->next->prev = x->prev;`。示例（已编译）：`addLast("ICS 46"); addFirst("ROCKS"); addLast("!")` → `[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS]`；然后 `removeLast()` 返回 "!"。

> 📘 **课外补充**（Thornton，Linked List Variations）：DLL 可以从离目标较近的一端开始遍历，代价为 Θ(min(i, n − i)) ≤ n/2 步——更快，但**仍然是 O(n)**。

### 5.3 DLL 分析

| 操作（head + tail） | 最坏情况 |
|---|---|
| 在头部 / 在尾部插入 | **O(1)** / **O(1)** |
| `get(index)`、`add(index, item)`、`remove(index)` | **O(n)**（遍历） |
| 从头部 / 从尾部删除 | **O(1)** / **O(1)**（`tail->prev`） |

### 5.4 完整实现：SLL 和 DLL

SLL（幻灯片代码，已修正错误）和 DLL（我的补全）。使用 `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined` 构建：无警告，无 sanitizer 报告。

```cpp
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>

// Singly linked list (slide code, bugs fixed)
template <typename T>
class SinglyLinkedList {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head;      // first node
    std::size_t n;   // number of items

    void rangeCheck(std::size_t index) const {   // 0 <= index < n
        if (index >= n)
            throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
    }

public:
    SinglyLinkedList() : head(nullptr), n(0) {}
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // Rule of Five: copy/move not provided here
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }
    std::size_t size() const { return n; }

    T get(std::size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; index--; }
        return finger->item;
    }
    void add(const T& item) {                          // at head
        head = new Node(item, head);
        ++n;
    }
    void add(std::size_t index, const T& item) {       // 0 <= index <= n
        if (index > n)
            throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
        if (index == 0) { add(item); return; }
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = new Node(item, finger);
        n++;
    }
    T remove() {                                       // at head
        if (head == nullptr) throw std::out_of_range("remove() on empty list");
        Node* temp = head;
        head = head->next;
        n--;
        T data = temp->item;
        delete temp;
        return data;
    }
    T remove(std::size_t index) {                      // remove at an index
        rangeCheck(index);
        if (index == 0) return remove();
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = finger->next;
        n--;
        T data = finger->item;
        delete finger;
        return data;
    }
    void print() const {
        std::cout << "[";
        for (Node* p = head; p != nullptr; p = p->next) std::cout << p->item << (p->next ? ", " : "");
        std::cout << "] n=" << n << '\n';
    }
};

// Doubly linked list with head and tail (my completion)
template <typename T>
class DoublyLinkedList {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr) : item(it), next(nx), prev(pv) {}
    };
    Node* head;
    Node* tail;
    std::size_t n;

    Node* nodeAt(std::size_t index) const {        // walk from the nearer end
        if (index < n / 2) {
            Node* p = head;
            for (std::size_t i = 0; i < index; ++i) p = p->next;
            return p;
        }
        Node* p = tail;
        for (std::size_t i = n - 1; i > index; --i) p = p->prev;
        return p;
    }

public:
    DoublyLinkedList() : head(nullptr), tail(nullptr), n(0) {}
    ~DoublyLinkedList() { while (!isEmpty()) removeFirst(); }
    DoublyLinkedList(const DoublyLinkedList&) = delete;
    DoublyLinkedList& operator=(const DoublyLinkedList&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

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
    T removeFirst() {
        if (isEmpty()) throw std::out_of_range("removeFirst() on empty list");
        Node* old = head;
        head = head->next;
        if (head != nullptr) head->prev = nullptr; else tail = nullptr;
        T data = old->item;
        delete old;
        --n;
        return data;
    }
    T removeLast() {
        if (isEmpty()) throw std::out_of_range("removeLast() on empty list");
        Node* old = tail;
        tail = tail->prev;
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T data = old->item;
        delete old;
        --n;
        return data;
    }
    T get(std::size_t index) const {
        if (index >= n) throw std::out_of_range("bad index");
        return nodeAt(index)->item;
    }
    void add(std::size_t index, const T& item) {
        if (index > n) throw std::out_of_range("bad index");
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);
        before->next = node;
        after->prev = node;
        ++n;
    }
    T remove(std::size_t index) {
        if (index >= n) throw std::out_of_range("bad index");
        if (index == 0) return removeFirst();
        if (index == n - 1) return removeLast();
        Node* victim = nodeAt(index);
        victim->prev->next = victim->next;
        victim->next->prev = victim->prev;
        T data = victim->item;
        delete victim;
        --n;
        return data;
    }
    void print() const {
        std::cout << "[";
        for (Node* p = head; p != nullptr; p = p->next) std::cout << p->item << (p->next ? ", " : "");
        std::cout << "] backwards [";
        for (Node* p = tail; p != nullptr; p = p->prev) std::cout << p->item << (p->prev ? ", " : "");
        std::cout << "] n=" << n << '\n';
    }
};

int main() {
    SinglyLinkedList<std::string> sll;                 // the worked sequence
    sll.add("ICS 46"); sll.add("ROCKS"); sll.add("!");
    sll.add(1, "?");                 sll.print();
    std::cout << "remove() -> " << sll.remove() << '\n';
    std::cout << "remove(1) -> " << sll.remove(1) << '\n';
    sll.print();
    try { sll.get(2); } catch (const std::out_of_range& e) { std::cout << "get(2): " << e.what() << '\n'; }

    DoublyLinkedList<std::string> dll;                 // the five DLL states
    dll.addLast("ICS 46"); dll.addFirst("ROCKS"); dll.addLast("!");
    dll.print();
    std::cout << "removeLast() -> " << dll.removeLast() << '\n';
    dll.add(1, "UCI");               dll.print();
    std::cout << "get(1) -> " << dll.get(1) << ", remove(1) -> " << dll.remove(1) << '\n';
    dll.print();
}
```


输出：

```text
[!, ?, ROCKS, ICS 46] n=4
remove() -> !
remove(1) -> ROCKS
[?, ICS 46] n=2
get(2): Index 2 out of bounds
[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS] n=3
removeLast() -> !
[ROCKS, UCI, ICS 46] backwards [ICS 46, UCI, ROCKS] n=3
get(1) -> UCI, remove(1) -> UCI
[ROCKS, ICS 46] backwards [ICS 46, ROCKS] n=2
```


### 5.5 练习

#### 双向链表的时间复杂度分析

与单向链表相同的表格，但针对双向链表。

<details>
<summary>解答</summary>

在头部插入 **O(1)**，在尾部插入 **O(1)**；`get` **O(n)**；`add(index)` **O(n)**；从头部删除 **O(1)**，从尾部删除 **O(1)**；`remove(index)` **O(n)**。只有尾部相关的行发生变化：`tail->prev` 可以一步到达倒数第二个节点。

</details>

## 6. ArrayList 与链表的比较

除非另有标注，均为最坏情况。

| 操作 | ArrayList | SLL | SLL + tail | DLL（head + tail） |
|---|---|---|---|---|
| 按下标 get | **O(1)** | O(n) | O(n) | O(n) |
| 在前端添加 | O(n)（移位） | **O(1)** | **O(1)** | **O(1)** |
| 在末尾添加 | **O(1) 均摊** | O(n) | **O(1)** | **O(1)** |
| 从前端删除 | O(n)（移位） | **O(1)** | **O(1)** | **O(1)** |
| 从末尾删除 | **O(1) 均摊** | O(n) | O(n) | **O(1)** |
| 按下标添加 / 删除 | O(n)（移位） | O(n)（遍历） | O(n)（遍历） | O(n)（遍历） |

在 ArrayList 中，O(n) 来自**移位**；在链表中，则来自**遍历**——拼接本身是 O(1)。每个节点还要为指针额外付出内存（在这台 g++ 构建上测得：SLL 的 `Node<int>` 为 16 字节，DLL 的 `Node<int>` 为 24 字节，而 ArrayList 的每个槽位为 4 字节）。

> 💡 **关键洞见**（Thornton）：更多的链接换来更快的操作，代价是更多的内存和更多的边界情况——应选择能满足所需操作速度的、最简单的变体。

## 7. 栈

### 7.1 栈的 ADT

**栈**是一种动态线性结构，元素以 **LIFO（Last In, First Out，后进先出）** 的方式插入和移除：只操作一端，即**栈顶（top）**。用煎饼来比喻：多放一张 = 在顶部 **push**（压入）；拿走一张 = **pop**（弹出）顶部；只看顶部而不拿走 = **peek**（查看）。目标：让 push 和 pop 尽可能高效。（图示：一摞彩色圆盘，顶部有 push/pop 箭头。）

### 7.2 跟踪 push 与 pop

输入 `To be or not to - be - - that - - - is`——一个单词表示 push，`-` 表示 pop：

| 之后 | 弹出 | 栈（栈底 → 栈顶） |
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


在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz stack
{"title": "输入序列：To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```


### 7.3 基于 ArrayList 的栈

在槽位 0–2 中画出 "ICS46 ROCKS !"，下标 0 是 **Front（前端）**，最后一个元素是 **End/Rear（末端）**。把**栈顶放在末端**：push = `add(item)`，pop = `remove()`，peek = `at(size() - 1)`——其他元素都不需要移动。

```cpp
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    std::size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }              // append at the end
    T pop() { return list.remove(); }                          // remove from the end
    const T& peek() const { return list.at(list.size() - 1); } // read the last item
};
```


示例（已编译，统计 n 次 push 时元素的复制与移位次数）：

```text
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)
```


栈顶在末端时，每次 push 稳定在约 2 次移动（均摊 O(1)）；栈顶在前端时，每次 push 约需 n/2 次移动（O(n)）。

> 📘 **课外补充**（Thornton，Amortized Analysis）：均摊 O(1) 约束的是任意序列的**总代价**（n 次 push 的工作量 ≤ 3n），而不是每次调用的代价——某一次让数组翻倍的 push 本身就是 O(n)。peek 的 O(1) 则是真正的最坏情况。

### 7.4 基于链表的栈

栈（LIFO）只操作它的栈顶。在只有 `head` 的单向链表（SLL）中（示意：head → item1 → … → item5 → null），唯一能在 O(1) 时间内改变的一端是头部。因此把**栈顶放在头部**：push = "在头部插入"（`add(item)`，见 [§4.6](#46-additem在头部插入)），pop = "删除头节点"（`remove()`，见 [§4.8](#48-remove删除头节点)）。三个操作都是**最坏情况 O(1)**。这与基于 ArrayList 的栈相反，后者的栈顶在末端。

```cpp
// inside LinkedStack<T>: Node* head (top), std::size_t n
void push(const T& item) {
    Node* oldHead = head;              // remember the current first node
    Node* newNode = new Node(item);    // next defaults to nullptr
    newNode->next = oldHead;           // link new node to the old head
    head = newNode;                    // new node becomes the head
    ++n;
}

T pop() {
    if (isEmpty()) throw std::underflow_error("pop from empty stack");
    Node* temp = head;
    head = head->next;                 // move head one to the right
    --n;
    T data = temp->item;               // copy the item out BEFORE deleting
    delete temp;
    return data;
}

const T& peek() const { return head->item; }   // (after the same empty check)
```


把 ICS46、ROCKS、! 压入，然后全部弹出（完整的类见 [§8.8](#88-完整实现linkedstack-与-linkedqueue)）：

```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from empty stack
```


> ⚠️ **易错点**：讲义中单向链表的 `remove()` 写的是 `T data = temp->data;`，但 `Node` 中的字段是 `item`，而不是 `data` → 应使用 `temp->item`。讲义也没有空检查；`pop()` 需要一个。

- **双向链表（有 head 和 tail）：** 在两端都是 O(1)，因此栈顶可以放在任一端——但每个节点都带有一个栈从不使用的 `prev`。
- **SLL 的尾部为栈顶（反向）：** 若只有 `head`，push/pop/peek 都是 **O(n)**（要走到末尾）。加上 `tail` 指针可使 push 与 peek 为 O(1)，但 **pop 仍是 O(n)**：删除最后一个节点后需要倒数第二个节点，而单向链表只能从 head 出发才能找到它。

### 7.5 如何选择？

| 实现 | push / pop / peek | 权衡 | 何时胜出 |
|---|---|---|---|
| ArrayList | O(1) 平均，O(1) 平均，O(1) | 内存更少，整体更快，但性能**"lumpy"（忽快忽慢）** | 关注整体性能 |
| 单向链表 | O(1)，O(1)，O(1) — **最坏情况** | 链接带来额外的时间和空间开销，但**保证**每个操作都很快 | 飞机进港降落；以高速率到达数据包的网络交换机 |
| 双向链表 | O(1) | 额外的内存开销，性能与 SLL 相同 | — |

🔑 **最佳选择取决于问题。**

> 📘 **课外补充**：Thornton 把 ArrayList 的"平均 O(1)"称为**均摊** O(1)：对任意真实的 push 序列，总代价除以 push 次数是常数，因为一次 O(n) 的扩容可以摊到 n 次廉价的 push 上。单次 push 仍可能是 O(n)——这就是"lumpy"的部分，也是无法承受某一步变慢的系统会选择链表的原因。

### 7.6 练习

#### 用 ArrayList 实现栈

使用 **ArrayList** 实现栈（操作有 `add(Item item)`、`add(int index, Item item)`、`remove()`）。(a) 栈顶应放在前端还是后端？(b) Pop、Push 和 Peek 如何实现？(c) Pop 和 Push 的**均摊**大 O 是多少？(d) Peek 的**最坏情况**大 O 是多少？(e) 若栈顶位于反方向，**最坏情况**大 O 是多少？

<details>
<summary>解答</summary>

(a) **后端**（End/Rear）——在那里添加/删除不移动任何元素。
(b) push = `add(item)`，pop = `remove()`，peek = `at(size() - 1)`。
(c) 都是 **O(1) 均摊**（偶尔在数组翻倍或缩到 ¼ 满时为 O(n)）。
(d) **O(1)**。
(e) 栈顶在前端：push = `add(0, item)`，pop = `remove(0)` 会移动所有元素 → **O(n)**；peek = `at(0)` 仍是 O(1)。

</details>

#### 用单向或双向链表实现栈

用以下两种结构实现栈：

- **单向链表**
- **双向链表**

(a) 栈顶应放在哪里？(b) 如何用链表实现 Pop、Push 和 Peek？(c) Pop、Push 和 Peek 的最坏情况大 O 运行时间是多少？(d) 若栈顶放在反方向，最坏情况大 O 是多少？

<details>
<summary>解答</summary>

- **(a)** SLL：在**头部**。带 head 和 tail 的 DLL：任一端。
- **(b)** push = 在头部插入；pop = 保存 `head`、向后移动、复制元素、删除旧节点；peek = `head->item`（pop/peek 都需要空检查）。代码见 [§7.4](#74-基于链表的栈)。
- **(c)** 全部为 **O(1) 最坏情况**。
- **(d)** 栈顶在尾部：只有 head 的 SLL 全部为 O(n)；带 head 和 tail 的 SLL 则 push/peek 为 O(1)，但 **pop 为 O(n)**；DLL 通过 `tail->prev` 全部为 O(1)。

</details>

## 8. 队列

### 8.1 队列 ADT：FIFO

**队列**是一种动态线性结构，用于存放顺序数据，它总是先移除**最早到达**的元素：元素严格按到达的顺序离开（FIFO，First In First Out，先进先出）。比喻：排队买票的人群。

- **入队（Enqueue）**：把新元素加到队伍的**末尾**。
- **出队（Dequeue）**：移除队伍**最前面**的元素。
- 目标：让**两个**操作的时间效率都尽可能高——队列有两个"业务端"，而栈只有一个。

### 8.2 队列操作示例

一个单词表示入队，`-` 表示出队并打印（输入与 [§7.2](#72-跟踪-push-与-pop) 中栈的示例相同）。队列从前到后书写：

| 步骤 | 输入 | 打印 | 操作后的队列 |
|---|---|---|---|
| 1–5 | To be or not to | | To be or not to |
| 6 | `-` | **To** | be or not to |
| 7 | be | | be or not to be |
| 8–9 | `-` `-` | **be**、**or** | not to be |
| 10 | that | | not to be that |
| 11–13 | `-` `-` `-` | **not**、**to**、**be** | that |
| 14 | is | | that is |

在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz queue
{"title": "输入序列：To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```


输出顺序就是输入顺序 `To be or not to be`——队列从不重新排序。[§8.8](#88-完整实现linkedstack-与-linkedqueue) 的程序会重演这一过程：`dequeued: To be or not to be`，然后是 `left in queue (2): front = that`。

### 8.3 实现选项一览

ArrayList、SLL 和 DLL 都要回答同样的四个问题：在哪里入队/出队、如何实现、最坏情况（或均摊）运行时间，以及方向反过来会怎样。答案汇总如下：

| 结构与布局 | 入队 | 出队 |
|---|---|---|
| ArrayList，front = 下标 0，rear = 末尾 | O(1) 均摊 | **O(n)**（左移） |
| ArrayList 反向，rear = 下标 0，front = 末尾 | **O(n)**（右移） | O(1) |
| 循环数组（📘 课外补充，见 [§9](#9-循环数组队列)） | O(1) 均摊 | O(1) |
| SLL，只有 head，front = head | **O(n)**（走到末尾） | O(1) |
| SLL，只有 head，反向 | O(1) | **O(n)** |
| ✅ SLL，head + tail，front = head，rear = tail | O(1) | O(1) |
| ❌ SLL，head + tail，反向 | O(1) | **O(n)** |
| DLL，head + tail，任一方向 | O(1) | O(1) |

### 8.4 基于 ArrayList 的队列

ArrayList 把第 0 个元素放在 0 号单元，因此队列中位于下标 0 的那一端代价都是 O(n)——其他所有元素都要移动。通常的布局是：用 `add(item)` 入队，用 `remove(0)` 出队。

```cpp
template <typename T>
class ArrayListQueue {
private:
    ArrayList<T> list;
public:
    void enqueue(const T& item) { list.add(item); }   // O(1) amortized
    T dequeue() {                                     // O(n): shifts everyone left
        if (list.isEmpty()) throw std::underflow_error("dequeue from empty queue");
        return list.remove(0);
    }
    const T& front() const { return list.at(0); }
};
```


入队 ICS46、ROCKS、!，然后全部取出：`ICS46 ROCKS !`（对照一个实现了 [§2](#2-arraylist动态数组) 中 ArrayList 操作的替身类编译运行得到）。

### 8.5 带 tail 指针的单向链表

只有 `head` 时，总有一个操作是 O(n)。**解决办法：保留一个 `tail` 指针**，在尾部入队，在头部出队。方向依然重要：`tail` 让你能在最后一个节点之后 O(1) 地*添加*，却不能 O(1) 地*删除*它（删除需要它的前驱节点）。

```cpp
// inside LinkedQueue<T>: Node* head (front), Node* tail (rear), std::size_t n
void enqueue(const T& item) {          // O(1)
    Node* newNode = new Node(item);
    if (isEmpty()) head = newNode;     // first node is both front and rear
    else tail->next = newNode;
    tail = newNode;
    ++n;
}

T dequeue() {                          // O(1)
    if (isEmpty()) throw std::underflow_error("dequeue from empty queue");
    Node* temp = head;
    head = head->next;
    if (head == nullptr) tail = nullptr;   // queue became empty
    --n;
    T data = temp->item;
    delete temp;
    return data;
}
```


向一个非空队列入队，然后把它清空——注意最后一次 `dequeue()` 如何重置 `tail`。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz queue
{"title": "带 head 和 tail 的 SLL", "ops": "enqueue(ICS46); enqueue(ROCKS); enqueue(!); dequeue(); dequeue(); dequeue()"}
```


> ⚠️ **易错点**：有两种空队列的情况。向空队列入队时没有 `tail->next` 可以设置，因此还要同时设置 `head`。出队最后一个元素时必须把 `tail = nullptr`，否则下一次入队会写入已释放的内存。

### 8.6 双向链表

想象一个 DLL，Head/Front 指向 ROCKS，Tail/Back 指向 "!"。带 head 和 tail 的 DLL 可以在**两端**都以 O(1) 插入和删除（删除后新的 tail 为 `tail->prev`），因此两个方向都能做到 O(1) 的入队和出队。代价是每个节点多一个 `prev`，而性能并不比带 tail 的 SLL 更好。DLL 也正是**双端队列**（double-ended queue，[§10](#10-双端队列)）所需要的结构：在两端添加和删除。

### 8.7 哪种最好？

以下答案是我的判断，依据与 [§7.5](#75-如何选择) 相同。

- **ArrayList**：直接使用时，出队为 O(n)——是一个糟糕的队列。若作为循环数组：O(1) 均摊，内存最少，但"lumpy"。
- **单向链表**：带 tail 指针时，两个操作都是 O(1) 最坏情况——这是保证，代价是每个节点一个指针。
- **双向链表**：两种方式都是 O(1)，但多出的 `prev` 占用内存，性能却相同。
- 最佳选择取决于问题（整体吞吐量 → 循环数组；每个操作都要快 → 带 tail 的 SLL）。

### 8.8 完整实现：LinkedStack 与 LinkedQueue

```cpp
#include <cstddef>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Stack on a singly linked list: top = head
template <typename T>
class LinkedStack {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;   // top
    std::size_t n = 0;

public:
    LinkedStack() = default;
    ~LinkedStack() { while (!isEmpty()) pop(); }
    LinkedStack(const LinkedStack&) = delete;             // Rule of Five: copy/move not provided here
    LinkedStack& operator=(const LinkedStack&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

    void push(const T& item) {                 // O(1)
        head = new Node(item, head);
        ++n;
    }
    T pop() {                                  // O(1)
        if (isEmpty()) throw std::underflow_error("pop from empty stack");
        Node* temp = head;
        head = head->next;
        --n;
        T data = temp->item;                   // copy out before delete
        delete temp;
        return data;
    }
    const T& peek() const {                    // O(1)
        if (isEmpty()) throw std::underflow_error("peek at empty stack");
        return head->item;
    }
};

// Queue on a singly linked list with head AND tail: front = head, rear = tail
template <typename T>
class LinkedQueue {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;   // front: dequeue here
    Node* tail = nullptr;   // rear: enqueue here
    std::size_t n = 0;

public:
    LinkedQueue() = default;
    ~LinkedQueue() { while (!isEmpty()) dequeue(); }
    LinkedQueue(const LinkedQueue&) = delete;
    LinkedQueue& operator=(const LinkedQueue&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

    void enqueue(const T& item) {              // O(1)
        Node* newNode = new Node(item);
        if (isEmpty()) head = newNode;
        else tail->next = newNode;
        tail = newNode;
        ++n;
    }
    T dequeue() {                              // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from empty queue");
        Node* temp = head;
        head = head->next;
        if (head == nullptr) tail = nullptr;   // became empty
        --n;
        T data = temp->item;
        delete temp;
        return data;
    }
    const T& front() const {
        if (isEmpty()) throw std::underflow_error("front of empty queue");
        return head->item;
    }
};

int main() {
    LinkedStack<std::string> st;
    st.push("ICS46"); st.push("ROCKS"); st.push("!");
    std::cout << "peek: " << st.peek() << ", size " << st.size() << "\npop:";
    while (!st.isEmpty()) std::cout << ' ' << st.pop();
    try { st.pop(); } catch (const std::underflow_error& e) { std::cout << "\nerror: " << e.what(); }

    LinkedQueue<std::string> q;
    std::istringstream in("To be or not to - be - - that - - - is");
    std::string t;
    std::cout << "\ndequeued:";
    while (in >> t) {
        if (t == "-") std::cout << ' ' << q.dequeue();
        else q.enqueue(t);
    }
    std::cout << "\nleft in queue (" << q.size() << "): front = " << q.front() << '\n';
}
```


```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from empty stack
dequeued: To be or not to be
left in queue (2): front = that
```


### 8.9 练习

#### 用 ArrayList 实现队列

用 **ArrayList** 实现队列：应在哪里入队和出队？实现入队和出队操作。最坏情况（或均摊）运行时间是多少？如果把入队和出队的方向反过来呢？

<details>
<summary>解答</summary>

- 在末尾用 `list.add(item)` 入队，在下标 0 处用 `list.remove(0)` 出队。
- 入队为 **O(1) 均摊**；出队为 **O(n)**（所有元素左移）。
- 反向（`add(0, item)` / `remove()`）：入队为 **O(n)**，出队为 O(1)。
- 无论哪种方式，都有一个操作是 O(n)，因为 ArrayList 把下标 0 固定在 0 号单元（修正方法见 [§9](#9-循环数组队列)）。

</details>

#### 用单向链表实现队列

用**单向链表**实现队列：应在哪里入队和出队？实现入队和出队操作。最坏情况运行时间是多少？如果把入队和出队的方向反过来呢？要做什么修改才能让两个操作都达到 O(1)？

<details>
<summary>解答</summary>

- 在头部出队，在最后一个节点处入队。
- 只有 head：出队 O(1)，入队 **O(n)**。反向：入队 O(1)，出队 **O(n)**。
- 修改：**尾指针**，front = head，rear = tail → 两者都是 O(1)（见 [§8.5](#85-带-tail-指针的单向链表)）。
- 陷阱：即使有尾指针，反向的队列出队仍是 O(n)。

</details>

#### 用双向链表实现队列

用**双向链表**实现队列：应在哪里入队和出队？实现入队和出队操作。最坏情况运行时间是多少？如果把入队和出队的方向反过来呢？

<details>
<summary>解答</summary>

- 在尾部入队（`newNode->prev = tail; tail->next = newNode; tail = newNode;`，若为空则设置 `head`），在头部出队（`head = head->next; head->prev = nullptr;`，若变空则 `tail = nullptr`）。
- 两者最坏情况都是 **O(1)**，反向时仍为 O(1)。代价是多出的 `prev` 指针。

</details>

## 9. 循环数组队列

### 9.1 为什么不用普通的 ArrayList？

队列在尾部入队，在前端出队。如果把队列保存在 ArrayList 中并把队首固定在下标 0，那么每次 `dequeue()` 都必须把剩下的元素全部左移，代价是 O(n)（`[A B C D]` → 出队 → `[B C D]`）。

**循环数组**可以改为移动起始下标。出队时，**队首下标**只需向前推进，没有任何元素需要移动，因此出队是 O(1)（A 出队之后，`front` 从 0 移到 1，B、C 留在原处）。

> 📘 **课外补充**（Thornton，*Stacks, Queues, and Deques*）：正常使用的 `std::vector` 有同样的问题。它总是把元素保存在单元 0…size−1 中，因此队列的一端被固定在 0 号单元，入队或出队就会变成 Θ(n)。修正办法是使用普通数组，让前端和后端的下标"浮动"。

### 9.2 队首、队尾与绕回

循环数组队列在一个**定长数组**中实现队列，并保存两个下标：

- `front_idx`：队首元素的位置。
- `rear_idx`：按一种约定指向**最后一个有效元素**，按另一种约定指向**下一个空位**。讲义的算法采用"下一个空位"。

两个下标都只向前移动。走到数组末尾时，它们用取模运算**绕回**到 0：

```text
index = (index + 1) % capacity
```


因此，队列的元素就是从 `front` 开始向右的槽位，可能继续绕回到槽位 0（例：容量为 6，`front_idx = 1`，队列为槽位 1–4 中的 A B C D，队尾位于槽位 4）。

| 操作 | 算法 | 代价 |
|---|---|---|
| enqueue(value) | `array[rear_idx] = value;` `rear_idx = (rear_idx + 1) % capacity;` | O(1) |
| dequeue() | `val = array[front_idx];` `front_idx = (front_idx + 1) % capacity;` 返回 `val` | O(1) |

在下面逐步演示（演示获得焦点时可用 ← / → 键）。演示采用 [§9.3](#93-满与空) 中的"记录大小"约定：队尾槽位 = `(front + n) % capacity`。注意观察 F 绕回到槽位 0：

```viz circular-queue
{"title": "容量为 5 的循环数组队列", "ops": "A B C D - - E F G", "capacity": 5, "interactive": true}
```


> ⚠️ **易错点**：幻灯片把入队和出队都标为"均摊 O(1)"。对于定容的循环数组，二者都是普通的 **O(1) 最坏情况**。只有当数组在满时**扩容**，才会出现"均摊"（见 [双端队列练习](#102-练习) 中的挑战题）。

### 9.3 满与空

若 `rear_idx` 是下一个空槽，那么队列为空和填满所有槽位时，都有 `front == rear`。有两种方法区分二者：

1. **始终保留一个空槽。** 那么
   - 空：`front == rear`
   - 满：`(rear + 1) % capacity == front`

   代价是浪费一个槽位。
2. **记录大小** `n`。空为 `n == 0`，满为 `n == capacity`，而且根本不需要 `rear`，因为它等于 `(front + n) % capacity`。

### 9.4 记录大小的版本

> 📘 **课外补充**：Thornton 和 algs4 的做法是让前端移动以修正数组。保存 `f`（队首元素的下标）和 `n`（元素个数）。入队写入 `(f + n) % capacity` 并执行 `++n`；出队读取 `items[f]`，然后执行 `f = (f + 1) % capacity` 和 `--n`。两者都是 O(1)（入队在数组翻倍时为均摊 O(1)）。保留计数 `n` 很重要：只有前端和后端两个下标时，"满"与"空"看起来一样。

示例（容量 2 → 翻倍为 4）：入队 1、2、3；出队 1、2；入队 4、5。此时 `f = 2`，5 已绕回到单元 0：各单元为 `[5, _, 3, 4]`，队列顺序为 3 4 5。

同一个例子放在容量为 4 的数组上（这里不需要扩容）。在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz circular-queue
{"title": "循环数组：队首移动，其余元素不移位", "ops": "1 2 3 - - 4 5", "capacity": 4, "interactive": true}
```


## 10. 双端队列

### 10.1 双端队列 ADT

**双端队列**（double-ended queue，读作 "deck"）在**两端**都可以添加和删除：

| 操作 | 含义 |
|---|---|
| `enqueueFront(x)` / `enqueueBack(x)` | 在前端 / 后端添加 |
| `dequeueFront()` / `dequeueBack()` | 从前端 / 后端删除并返回 |
| `front()` / `back()` | 查看前端 / 后端元素，但不删除 |

- 若**前端下标**指向第一个元素，**后端下标**指向下一个元素将放置的位置（或指向最后一个元素），那么双端队列就是一个循环数组，其中**两个下标都可以朝两个方向移动**。`enqueueFront` 使 `front` *向左*移动，并从 0 绕回到 `capacity − 1`：`front = (front - 1 + capacity) % capacity`。`dequeueBack` 使后端下标同样向左移动。
- 它是一种**通用结构**：只用一端就是栈；在一端添加、另一端删除就是队列。
- C++ 自带一个：`std::deque`。
- 作为**链表**，双端队列需要在两端删除，因此要用**双向链表**（单向链表无法在 O(1) 内删除最后一个节点）；见 [§5](#5-双向链表)。

> ⚠️ **易错点**：当 `front` 为 0 时，`(front - 1) % capacity` 在 C++ 中为 **−1**，因为 `%` 保留左操作数的符号。应先加上 `capacity` 再取模。

### 10.2 练习

#### 循环数组上的双端队列

在循环数组上实现双端队列的以下方法，并更新前端/后端下标：

1. `enqueueFront(val)`：把元素加到双端队列的前端
2. `enqueueBack(val)`：把元素加到双端队列的后端
3. `dequeueFront()`：从前端删除并返回元素
4. `dequeueBack()`：从后端删除并返回元素

**挑战题：** 当循环数组动态扩容时，如何更新双端队列？（向已满的双端队列添加元素需要扩大容量。）

> 提示：保存 `front` 和大小 `n`；这样后端元素就位于 `(front + n − 1) % capacity`。

<details>
<summary>解答</summary>

保存 `front` 和 `n`（即 [§9.3](#93-满与空) 中的第 2 种方法）。队尾槽位为 `(front + n) % capacity`。

```cpp
void enqueueFront(const T& val) {
    if (n == capacity) resize(2 * capacity);
    front = (front - 1 + capacity) % capacity;   // step left, wrapping
    data[front] = val;
    n++;
}
void enqueueBack(const T& val) {
    if (n == capacity) resize(2 * capacity);
    data[(front + n) % capacity] = val;          // rear slot
    n++;
}
T dequeueFront() {
    if (n == 0) throw std::underflow_error("empty deque");
    T val = data[front];
    front = (front + 1) % capacity;
    n--;
    return val;
}
T dequeueBack() {
    if (n == 0) throw std::underflow_error("empty deque");
    T val = data[(front + n - 1) % capacity];    // last element
    n--;
    return val;
}
```


**挑战：扩容。** 不能把旧数组逐个单元复制到新数组的相同位置，因为元素可能绕过了数组末尾。分三步：

1. **分配**一个更大的数组（容量翻倍）。
2. **展开**：按双端队列的顺序把元素依次放入新数组：新 `[k]` = 旧 `[(front + k) % oldCapacity]`，k = 0 … n−1。
3. **重置** `front = 0` 和 `rear = size`（使用记录大小的版本时，`rear` 直接由 `n` 推出）。

```cpp
void resize(int newCap) {
    T* bigger = new T[newCap];
    for (int k = 0; k < n; k++)                  // unroll in deque order
        bigger[k] = data[(front + k) % capacity];
    delete[] data;
    data = bigger;
    capacity = newCap;
    front = 0;                                   // rear slot is now n
}
```


采用加倍策略时，每次入队是**均摊 O(1)**（与 [§3](#3-扩容与均摊分析) 中 ArrayList 的论证相同）；出队为 O(1)。从容量 2 开始的测试运行：`enqueueBack(1); enqueueBack(2); enqueueFront(0); enqueueFront(-1); enqueueBack(3)`，然后执行一次 `dequeueFront()`、一次 `dequeueBack()`，再对前端出队直到为空：

```text
deque size=5 capacity=8 : -1 0 1 2 3
dequeued: -1 3 0 1 2
```


</details>

## 11. 栈的应用：表达式求值

### 11.1 栈出现在哪里

编译器与解释器中的基本机制；浏览器的后退按钮；文字处理器中的撤销。本节讲的是编译器/解释器的情形：对算术表达式求值。

### 11.2 中缀与后缀

- **中缀（Infix）**：运算符位于操作数**之间**；这是标准数学记法，需要括号来表示优先级。例：`( ( 2 + 3 ) * ( 4 * 5 ) )`。
- **后缀（Postfix）**：运算符位于操作数**之后**，**没有括号**；用一个栈从左到右求值，没有歧义。

要把完全加括号的中缀表达式转换为后缀，就由内向外，把每个最内层的 `( a op b )` 改写为 `a b op`：
`( ( 2 + 3 ) * ( 4 * 5 ) )` ⇒ 子式 `((2 3 +) * (4 5 *))` ⇒ **`2 3 + 4 5 * *`**。操作数的顺序保持不变，只有运算符会移动。

### 11.3 Dijkstra 双栈算法

从左到右读取完全加括号的中缀表达式，使用一个**值栈**和一个**运算符栈**：

- 操作数：压入值栈。
- 运算符：压入运算符栈。
- 左括号：忽略。
- 右括号：弹出一个运算符和两个值；把该运算符作用于这两个值的结果压入值栈。

algs4 的演示展示了一帧：值栈为 1, 2，运算符栈为 +, +。幻灯片上没有给出表达式；它与 algs4 演示使用的表达式 `( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )` 一致，因此下面的跟踪是根据 algs4 推断出来的。栈从底到顶：

| 读入的 token | 值栈 | 运算符栈 |
|---|---|---|
| `( 1 + ( ( 2 +` | 1 2 | + + ← *幻灯片上所示的那一帧* |
| `3 )` → 2 + 3 | 1 5 | + |
| `* ( 4 * 5 )` → 4 * 5 | 1 5 20 | + * |
| `)` → 5 * 20 | 1 100 | + |
| `)` → 1 + 100 | **101** | |

每个运算都必须有自己的括号：`)` 就是"现在应用最近的那个运算符"的信号。

在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz two-stack-eval
{"title": "Dijkstra 双栈算法", "expression": "( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )", "interactive": true}
```


### 11.4 操作数顺序

algs4 的 "Dijkstra's 2-Stack Demo" 视频（[Google Drive](https://docs.google.com/file/d/1kLs501v5QjCoGAp5lO-58KUpNXyibNCm/preview)）附有一条注释 *"video seems to have the order of the operands flipped."*（意即视频中操作数的顺序似乎颠倒了）。规则是：**第一个弹出的值是右操作数**（它最后被压入），第二个弹出的是左操作数。写成代码就是：`v1 = pop()`，`v2 = pop()`，`push(v2 op v1)`。

示例：`( 10 - 4 )` 先弹出 4，再弹出 10 → 10 − 4 = **6**。若颠倒，则得到 4 − 10 = −6。对于 `+` 和 `*`，顺序无关紧要，这也是演示的答案仍然正确的原因。

> ⚠️ **易错点**：对 `-` 和 `/` 而言，顺序很重要。应写下 v1 和 v2，然后计算 `v2 op v1`。

### 11.5 后缀表达式求值

从左到右处理表达式：若是操作数，就压栈；若是运算，就弹出 2 个操作数，并压入运算结果。最后剩下的那一个元素（`peek()`）即为答案。下面是 `(52 - ((5 + 7) * 4))` ⇒ `52 5 7 + 4 * -` 的跟踪（从底到顶）：

| Token | 动作 | 栈 |
|---|---|---|
| `52` `5` `7` | 压入 ×3 | 52 5 7 |
| `+` | v1=7, v2=5, push(v2+v1)=12 | 52 12 |
| `4` | push(4) | 52 12 4 |
| `*` | v1=4, v2=12, push(v2*v1)=48 | 52 48 |
| `-` | v1=48, v2=52, push(v2-v1)=4 | 4 → peek()=4 |

在下面逐步演示（演示获得焦点时可用 ← / → 键）：

```viz postfix-eval
{"title": "52 5 7 + 4 * -", "expression": "52 5 7 + 4 * -", "interactive": true}
```


```cpp
long evalPostfix(const std::string& expr) {
    LinkedStack<long> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
            long v1 = s.pop();               // right operand (popped first)
            long v2 = s.pop();               // left operand
            s.push(applyOp(tok, v2, v1));    // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}
```


`evalPostfix` 对 `52 5 7 + 4 * -`、`5 1 2 + 4 * + 3 -` 和 `10 4 -` 分别输出 `4 14 6`（`applyOp(op, left, right)` 返回 `left op right`；`LinkedStack` 见 [§8.8](#88-完整实现linkedstack-与-linkedqueue)）。

### 11.6 练习

#### 求值中缀与后缀表达式

- 用双栈方法对**中缀**表达式求值：`( ( 2 + 3 ) * ( 4 * 5 ) )`
- 用一个栈对**后缀**表达式求值：`5 1 2 + 4 * + 3 -`
- 把上面的后缀表达式转换回中缀

<details>
<summary>解答</summary>

**(a)** = **100**。值/运算符（从底到顶）：`( ( 2 + 3 )` 之后为 5 / 空；`* ( 4 * 5 )` 之后为 5 20 / `*`；最后的 `)` → 5 × 20 = 100。

**(b)** = **14**：

| Token | 动作 | 栈 |
|---|---|---|
| `5` `1` `2` | 压入 ×3 | 5 1 2 |
| `+` | v1=2, v2=1 → 3 | 5 3 |
| `4` `*` | v1=4, v2=3 → 12 | 5 12 |
| `+` | v1=12, v2=5 → 17 | 17 |
| `3` `-` | v1=3, v2=17 → 14 | 14 |

逐步检查 (a) 和 (b)：

```viz two-stack-eval
{"title": "中缀检查 (a)", "expression": "( ( 2 + 3 ) * ( 4 * 5 ) )"}
```


```viz postfix-eval
{"title": "后缀检查 (b)", "expression": "5 1 2 + 4 * + 3 -"}
```


**(c)** 把数字换成表达式再压栈：`((5 + ((1 + 2) * 4)) - 3)`，即 5 + (1 + 2) × 4 − 3 = 14。操作数的顺序 5, 1, 2, 4, 3 保持不变。

</details>

## 12. 队列的应用

Spotify 播放列表（歌曲按排队的顺序播放）、数据缓冲（Netflix、Hulu）、异步数据传输（文件 I/O、套接字）、共享资源请求（打印机）、流量分析，以及呼叫中心的等待时间。

> 💡 **关键洞见**：当输入速率与输出速率**不匹配**时使用队列：元素成批到达、却被稳定地处理，队列按到达顺序保存积压的元素。

## 13. 速查与五个要点

| 操作 | ArrayList | SLL | SLL + tail | DLL | ArrayList 上的栈（栈顶在末尾） |
|---|---|---|---|---|---|
| 按下标访问 | O(1) | O(n) | O(n) | O(n) | — |
| 在前端添加 / 删除 | O(n) | O(1) | O(1) | O(1) | — |
| 在末尾添加 | O(1) 均摊 | O(n) | O(1) | O(1) | push：O(1) 均摊 |
| 在末尾删除 | O(1) 均摊 | O(n) | O(n) | O(1) | pop：O(1) 均摊 |
| 按下标添加 / 删除 | O(n) | O(n) | O(n) | O(n) | — |
| peek | — | — | — | — | O(1) |

| ADT | 顺序 | 添加 / 删除 / 查看 | 最合适的链表 | 两端的位置 | 代价 |
|---|---|---|---|---|---|
| 栈 | LIFO | push / pop / peek | SLL，只有 head | 栈顶 = head | O(1) 最坏情况 |
| 队列 | FIFO | enqueue / dequeue / front | SLL，head + tail | 队首 = head，队尾 = tail | O(1) 最坏情况 |
| ArrayList 上的栈 | LIFO | push / pop / peek | — | 栈顶 = 末尾 | O(1) 均摊（"lumpy"） |
| ArrayList 上的队列 | FIFO | enqueue / dequeue | — | 队首 = 下标 0 | dequeue O(n) |
| 循环数组队列 / 双端队列 | FIFO / 两端 | enqueue / dequeue | — | 队首移动，用 `%` 绕回 | O(1)（若扩容则为均摊） |

ArrayList 的扩容策略：默认容量为 2；满时 ×2；降至 ¼ 满时 ×½。改为每次加一则会使每次 `add` 均摊为 Θ(n)。

**需要记住的五个要点**

1. 每个带下标的链表操作都是 O(n)，因为要**遍历**；拼接本身是 O(1)。在 SLL 中插入/删除需要**前一个**节点，而下标 0 比较特殊，因为它会改变 `head`。DLL 的 `prev` 使删除尾节点为 O(1)；SLL 即使有尾指针，删除尾节点也是 O(n)。
2. ArrayList 在末尾的 `add`/`remove` 是**均摊** O(1)（加倍，降至 ¼ 满时缩容），但最坏情况是 O(n)；在前端或中间则因移位而为 O(n)。每次增加固定大小的容量会使每次 add 为 Θ(n)。
3. 基于链表的栈把**栈顶放在头部**（push、pop、peek 都是 O(1) 最坏情况）；基于 ArrayList 的栈把栈顶放在**末尾**（O(1) 均摊，"lumpy"）；放错端则为 O(n)。
4. 基于 SLL 的队列需要一个 **tail** 指针，且必须**在 tail 入队，在 head 出队**；普通的 ArrayList 队列总有一个 O(n) 操作，因此应使用循环数组（保存队首下标和计数，用 `%` 绕回）——同一结构可以扩展为双端队列。
5. **第一个弹出的值是右操作数**：计算 `v2 op v1`（对 `-` 和 `/` 很重要）；后缀表达式只需要一个栈、不需要括号，而完全加括号的中缀表达式则需要 Dijkstra 的双栈。复制出元素**之后**再 `delete`，并在每个修改操作中更新 `n`。
