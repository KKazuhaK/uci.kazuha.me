---
title: "算法分析"
summary: "为什么要分析算法，实测计时（倍增测试、幂律），代价模型与波浪号记法，Big-O / Big-Ω / Big-Θ，常见增长阶，空间复杂度，以及用递推式、递归树和主定理分析递归。"
topics:
  - analysis
kind: "topic"
order: 502
---

# 信息与计算机科学 46 — 话题：算法分析

## 目录

- [1. 为什么要分析算法？](#1-为什么要分析算法)
- [2. 运行时间的实测分析](#2-运行时间的实测分析)
- [3. 运行时间的数学模型](#3-运行时间的数学模型)
- [4. 渐近分析：Big-O、Big-Ω、Big-Θ](#4-渐近分析big-obig-ωbig-θ)
- [5. 常见的增长阶](#5-常见的增长阶)
- [6. 空间复杂度](#6-空间复杂度)
- [7. 递归分析：递推式与递归树](#7-递归分析递推式与递归树)
- [8. 主定理](#8-主定理)
- [9. 完整实现](#9-完整实现)
- [10. 速查与五个要点](#10-速查与五个要点)

> 本章介绍预测算法时间和内存如何随输入增长的工具：计时实验、操作计数、渐近记号，以及递归代码的递推式。它只假设你具备基本的 C++ 知识（循环、函数、数组与 `std::vector`；参见 [C++ 基础](topic-cpp.zh-CN.md)），其余章节（[线性结构](topic-linear.zh-CN.md)、[排序](topic-sorting.zh-CN.md)、[哈希表](topic-hashing.zh-CN.md)等）都会用到这里的结果。

## 1. 为什么要分析算法？

程序员同时扮演三种角色：**程序员**（需要一个能用的解）、**客户**（希望它高效）以及**理论家**（想理解它为何如此表现）。分析同时服务这三种角色。分析效率的理由：

- **预测**大输入下的性能；
- **比较**解决同一问题的算法；
- **保证**最坏情形的表现；
- **理解**行为背后的理论；
- **避免**性能缺陷。

**计算复杂度**分为两部分：**时间复杂度**（运行时间如何随输入规模增长）和**空间复杂度**（内存用量如何增长）。时间可以从两个方面入手：测量它（[§2](#2-运行时间的实测分析)）和建模它（[§3](#3-运行时间的数学模型)）；模型随后用渐近记号概括（[§4](#4-渐近分析big-obig-ωbig-θ)）。空间见 [§6](#6-空间复杂度)，递归算法见 [§7](#7-递归分析递推式与递归树)和 [§8](#8-主定理)。

## 2. 运行时间的实测分析

### 2.1 运行示例：3-SUM

给定 n 个互不相同的数，有多少个**无序三元组**之和为 0？对输入 `30 -40 -20 -10 40 0 10 5`，答案是 **4**：(`30 -40 10`)、(`30 -20 -10`)、(`-40 40 0`) 和 (`-10 0 10`)。暴力法对每个满足 `i < j < k` 的三元组各尝试一次：

```cpp
long threeSum(const std::vector<int>& a) {
  size_t n = a.size();
  long count = 0;
  for (size_t i = 0; i < n; i++)
    for (size_t j = i + 1; j < n; j++)
      for (size_t k = j + 1; k < n; k++)
        if (a[i] + a[j] + a[k] == 0) count++;
  return count;
}
```

对随机整数文件计时的结果如下：

| 文件 | n | 三元组数 | 用时（秒） |
|---|---|---|---|
| 8ints.txt | 8 | 4 | 0 |
| 1Kints.txt | 1000 | 70 | 0.081 |
| 2Kints.txt | 2000 | 528 | 0.38（重跑：0.371） |
| 4Kints.txt | 4000 | 4039 | 2.792 |
| 8Kints.txt | 8000 | 32074 | 21.623 |
| 16Kints.txt | 16000 | 255181 | 177.344 |

同一输入运行两次得到的时间不同（0.38 与 0.371）：测量本身带有噪声。

> 📘 **延伸阅读**：algs4 把这看作科学方法：观察、提出模型、预测一个未测量的情形、验证、再重复。下面的倍增测试正是这个循环。

### 2.2 对数-对数图与幂律

画出 T(n) 关于 n 的图，然后重画到**对数-对数**图上。如果各点落在一条直线上，运行时间就是一个**幂律**：

$$T(n) = a\,n^b \quad\Longrightarrow\quad \log T(n) = b \log n + \log a$$

在对数-对数图上，斜率为 **b**，截距为 log a。下面逐个加入 3-SUM 的测量值，并给出它们的倍增比（演示获得焦点时，← / → 键可用）：

```viz doubling-test
{"title": "3-SUM 倍增测试", "n": [1000, 2000, 4000, 8000, 16000], "times": [0.081, 0.38, 2.792, 21.623, 177.344]}
```

从 lg n = 11.97 到 13.97，直线上升 7.47 − 1.48 ≈ 6.0，跨度为 2.0，因此斜率 **b = 3**。拟合模型为 **T(n) ≈ 0.42 × 10⁻¹⁰ n³** 秒。

### 2.3 倍增假设

不必画图，只需把 n 加倍并取比值；常数 a 会被约去：

$$\frac{T(n)}{T(n/2)} = \frac{a\,n^b}{a\,(n/2)^b} = 2^b$$

- **b**：从 8000 到 16000，比值为 177.344 / 21.623 ≈ **8.2**，因此 b ≈ lg 8.2 ≈ **3**。
- **a**：已知 b 之后，T(16000) = 177.34 = a × 16000³，得 a ≈ 0.43 × 10⁻¹⁰（穿过所有点的拟合直线给出约 0.42 × 10⁻¹⁰）。

测量表中所有的比值：

| n | T(n)（秒） | T(n)/T(n/2) | lg 比值 |
|---|---|---|---|
| 8 | 0 | — | — |
| 1000 | 0.081 | — | — |
| 2000 | 0.38 | 4.7 | 2.2 |
| 4000 | 2.792 | 7.3 | 2.9 |
| 8000 | 21.623 | 7.7 | 2.95 |
| 16000 | 177.344 | 8.2 | 3.04 |

**为什么要用较大的输入规模？** n 较小时时间极短，计时器分辨率和噪声在测量中占比很大（n = 8 甚至读出 0），低阶项和固定开销在 n³ 旁边也不可忽略。比值只有在 n 较大时才会稳定在 8 附近。

这个实验可以在任何机器上重复。[§9](#9-完整实现) 中的计时程序（用 `-O2` 编译，随机整数，小 n 取多次运行的最小值）给出 n = 500 到 4000 的比值在 6.4 到 8.8 之间，因此 **b ≈ 3** 依然成立，但 a ≈ 0.57 × 10⁻¹⁰（n = 4000 时为 3.6 秒）：不同硬件上常数不同。

> ⚠️ **易错点**：小 n 时的比值不可靠。程序输出中 n = 1000 时比值为 6.4，n = 2000 时为 8.8：两者都是围绕真值 8 的噪声。应从最大的规模判断 b，绝不根据计时器读数为 0 的短时运行来判断。

### 2.4 什么决定 a 和 b

对于 T(n) = a·n^b：

| | 与系统无关的因素 | 与系统相关的因素 |
|---|---|---|
| 决定 | 指数 **b**（并影响 a） | 只决定常数 **a** |
| 例子 | 操作所用的数据结构与算法；算法本身；输入数据 | 硬件（CPU、内存、缓存）；软件（编译器、垃圾回收器）；系统（操作系统、网络等） |

所以 b 是算法及其输入的性质；更快的机器改变的是 a，绝不会改变 b。

### 2.5 练习

#### 从计时表中选出模型

假设你对代码计时，得到以下观测。哪一个函数最接近 T(n) 的模型？请写出推导过程。

A. n²  B. 6 × 10⁻⁴ n  C. 5 × 10⁻⁹ n²  D. 7 × 10⁻⁹ n²

| 输入规模 | 1000 | 2000 | 4000 | 8000 | 16000 | 32000 |
|---|---|---|---|---|---|---|
| 用时 | 0 | 0.0 | 0.1 | 0.3 | 1.3 | 5.1 |

> 提示：用最大两个规模的倍增比求 b，再解出 a。

<details>
<summary>解答</summary>

**解答：C。**

1. 由两个最大规模求 b：5.1 / 1.3 ≈ 3.9 ≈ 2² → **b ≈ 2**。这排除了 B（线性）。
2. 由 n = 32000 求 a：a = 5.1 / 32000² = 5.1 / (1.024 × 10⁹) ≈ **5 × 10⁻⁹**。
3. 检验：A 预测在 n = 32000 时约为 10⁹ 秒；D 预测为 7.2 秒。C 预测在 32000 时为 5.1 秒，在 16000 时为 1.28 秒。✓

忽略小的规模：0.3 / 0.1 = 3 主要是计时器取整造成的。

</details>

## 3. 运行时间的数学模型

### 3.1 总时间 = Σ 代价 × 频率

Donald Knuth 的原理（20 世纪 60 年代）：**总运行时间 = 对所有操作求和，每一项为 代价 × 频率。**

| 代价 | 频率 |
|---|---|
| 与系统和机器有关 | 与算法和数据有关 |
| 精确代价取决于机器与编译器；分析程序以找出其基本操作 | 取决于数据结构、算法设计和输入；原则上可以得到精确的数学模型 |

基本 C++ 操作的相对代价为 `int add < int multiply < int divide < float add < float multiply < float divide`。内存访问的代价各不相同，但基本模型假设它与一次加法的代价差不多。一张简单的代价表：

| 操作 | 例子 | 代价 |
|---|---|---|
| 变量声明 | `int a;` | c1 |
| 赋值 | `a = b;` | c2 |
| 整数比较 | `a < b;` | c3 |
| 数组/向量访问 | `a[i]`、`v[i]` | c4 |
| 容器大小 | `v.size()` | c5 |
| 动态分配 | `new int[n]`、`std::vector<int> v(n)` | c6·n |

分配是个例外：它的代价与 n 成正比，而不是常数。

### 3.2 数操作次数：1-Sum

给定 n 个互不相同的数，有多少个数等于 0？

```cpp
int count = 0;
for (size_t i = 0; i < n; i++) {
  if (a[i] == 0) {
    count++;
  }
}
```

| 操作 | 频率 | 原因 |
|---|---|---|
| 变量声明 | 2 | `count`、`i` |
| 赋值 | 2 | `count = 0`、`i = 0` |
| 小于 | **n + 1** | `i < n` 为真 n 次，最后为假一次以退出 |
| 相等 | n | `a[i] == 0` |
| 数组访问 | n | `a[i]` |
| 自增 | **n 到 n + 1** | `i++` 执行 n 次，若存在一个 0 则另加一次 `count++` |

[§9](#9-完整实现) 中的插桩版本在 n = 10 时输出 `less=11 eq=10 access=10`，无零时 `incr=10`，有一个零时 `incr=11`：

```text
1-Sum, no zero:  decl=2 assign=2 less=11 eq=10 access=10 incr=10
1-Sum, one zero: decl=2 assign=2 less=11 eq=10 access=10 incr=11
```

> ⚠️ **易错点**：循环判断条件比循环体多执行 **一次**（最后那次判断失败），所以 `i < n` 计为 n + 1 次，而不是 n 次。另外，由于数互不相同，至多只有一个数为 0，因此自增次数为 n 到 n + 1；若不要求“互不相同”，上界将是 n 到 2n。

### 3.3 数操作次数：2-Sum

给定 n 个互不相同的数，有多少个*无序*数对（“二元组”）之和为 0？暴力法对每个数对 `i < j` 尝试一次：

```cpp
int count = 0;
for (size_t i = 0; i < n; i++) {
  for (size_t j = i + 1; j < n; j++) {
    if (a[i] + a[j] == 0) {
      count++;
    }
  }
}
```

对于固定的 `i`，内层循环体执行 `n - i - 1` 次，因此总计 $(n-1) + \dots + 1 + 0 = n(n-1)/2$ 次，每个数对一次。每个循环*判断*都比其循环体多执行一次。计数如下：

| 操作 | 频率 | 来源 |
|---|---|---|
| 变量声明 | $n + 2$ | `count`、`i`，以及每次外层迭代中的 `j` |
| 赋值 | $n + 2$ | `count = 0`、`i = 0`、`j = i+1` ×n |
| 小于 | $(n+1)(n+2)/2$ | 外层：$n+1$；内层：$n + (n-1) + \dots + 1 = n(n+1)/2$ |
| 相等 | $n(n-1)/2$ | 每个内层循环体一次 |
| 数组访问 | $n(n-1)$ | `a[i]`、`a[j]`：每个内层循环体两次 |
| 自增 | $n(n+1)/2$ 到 $n^2$ | `i++` ×n + `j++` ×n(n−1)/2，另加零次或多次 `count++` |

这已经繁琐到难以手算，因此我们选定一种代价模型并只保留首项（[3.4](#34-波浪号记法)、[3.5](#35-简化代价模型--波浪号)）：暴力法 2-Sum 执行 **$\sim n^2$** 次数组访问。

[§9](#9-完整实现) 中的插桩程序在 n = 10 且没有数对时，与上表每一行都一致：

```text
2-Sum n=10: pairs=0
   decl=12 assign=12 less=66 eq=45 access=90 incr=55
  formulas: n+2=12 (n+1)(n+2)/2=66 n(n-1)/2=45 n(n-1)=90 n(n+1)/2=55 n^2=100
```

> ⚠️ **易错点**：外层 `<` 判断计为 $n+1$ 次，而不是 $n$ 次，原因与 1-Sum 相同；内层判断加起来是 $n(n+1)/2$，而不是 $n(n-1)/2$。

### 3.4 波浪号记法

只保留**首项**来估计运行时间（或内存）：当 n 很大时，低阶项可以忽略。

| 表达式 | 波浪号 |
|---|---|
| (1/6)n³ + 10n + 100 | ~ n³ |
| (1/6)n³ + 100n² + 47 | ~ n³ |
| (1/6)n³ + 100n^(2/3) + (1/2)/n | ~ n³ |

> 📘 **延伸阅读**：algs4 将 g(n) ~ f(n) 定义为 g(n)/f(n) → 1，它保留了系数：第一行严格来说是 ~ (1/6)n³。上面的 "~ n³" 形式只是增长阶的简写。Big-O（[§4](#4-渐近分析big-obig-ωbig-θ)）连常数也去掉。

### 3.5 简化：代价模型 + 波浪号

两种简化让计数变得可行：(1) **代价模型**：用一种基本操作作为运行时间的代理，例如**数组访问**；(2) 用波浪号记法描述它的频率。应用到 2-Sum 上：

| 操作 | 频率 | 波浪号 |
|---|---|---|
| 变量声明 | n + 2 | ~ n |
| 赋值 | n + 2 | ~ n |
| 小于 | (n + 1)(n + 2)/2 | ~ n²/2 |
| 相等 | n(n − 1)/2 | ~ n²/2 |
| 数组访问 | n(n − 1) | ~ n² |
| 自增 | n(n + 1)/2 到 n² | ~ n²/2 到 ~ n² |

结果：2-SUM 问题需要 **~ n² 次数组访问**，因此每对数执行一次的操作都是平方级的。3-SUM 的推理相同：C(n, 3) ~ n³/6 个三元组，每个三元组 3 次访问，共 **~ n³/2 次数组访问**，与实验得到的 b = 3 吻合。[§9](#9-完整实现) 中的程序在 8 个数的例子上验证了这一计数：4 个三元组，168 = 3 · C(8,3) 次访问。

### 3.6 练习

#### 2-Sum 的操作计数

给定 n 个互不相同的数，计算和为 0 的无序数对数目。作为 n 的函数，[3.3](#33-数操作次数2-sum) 中的代码各类操作（变量声明、赋值、小于、相等、数组访问、自增）分别执行多少次？

> 提示：内层循环体每个数对执行一次，而每个循环判断都比其循环体多执行一次。

<details>
<summary>解答</summary>

声明 $n+2$ 次，赋值 $n+2$ 次，`<` $(n+1)(n+2)/2$ 次，`==` $n(n-1)/2$ 次，数组访问 $n(n-1)$ 次，自增 $n(n+1)/2$ 到 $n^2$ 次。关键原因：内层循环体每个数对执行一次，共 $n(n-1)/2$ 次，而每个循环判断都比其循环体多执行一次。波浪号形式：$\sim n^2$ 次数组访问。

</details>

## 4. 渐近分析：Big-O、Big-Ω、Big-Θ

### 4.1 为什么要“往大处想”

比较 $f(n) = n$、$g(n) = 4n$ 和 $h(n) = n^2$。对于小的 n，$f$ 和 $g$ 看起来差别很大，而 $h$ 甚至*低于* $g$（$n^2 < 4n$ 在 $n < 4$ 时成立）。对于大的 n，$f$ 和 $g$ 与 $h$ 相比看起来很相似，而后者的增长速度明显不同。

| n | $f = n$ | $g = 4n$ | $h = n^2$ |
|---|---|---|---|
| 2 | 2 | 8 | 4 |
| 4 | 4 | 16 | 16 |
| 100 | 100 | 400 | 10,000 |

**渐近分析**用输入规模 n 的函数来描述运行时间，只看 n 变大时的增长：**忽略小的 n（“往大处想”）**；**增长越慢，算法越好。**

### 4.2 Big-O：上界

$f(n)$ 是 $O(g(n))$，若存在正常数 $c$ 与 $n_0$，使得

$$f(n) \le c \cdot g(n) \quad \text{for all } n \ge n_0.$$

$f$ 是实际的运行时间，$g$ 是形状相同但更简单的函数；$c$ 吸收常数因子，$n_0$ 忽略小的 n。通俗地说：“我的代码**至多**需要这么长时间。”例子：$3n^3 + 2n + 7 = O(n^3)$；$2^n + n^2 = O(2^n)$；$1000 = O(1)$。$3n^3 + 2n + 7 = O(n^6)$ 也成立，但它是**没有用的界**，应给出最紧的界。Big-O 让我们在 n 增大时进行高层次的比较，忽略低层细节；它**不是**精确的运行时间。

**求 $c$、$n_0$ 的例子：** 对于 $n \ge 1$，$2n \le 2n^3$ 且 $7 \le 7n^3$，所以 $3n^3 + 2n + 7 \le 12n^3$。因此 $c = 12$、$n_0 = 1$ 即可，$3n^3 + 2n + 7 = O(n^3)$。捷径：**保留增长最快的项，去掉它的系数。**

### 4.3 Big-Ω：下界

$f(n)$ 是 $\Omega(g(n))$，若存在正的 $c$、$n_0$，使得对所有 $n \ge n_0$ 有 $f(n) \ge c \cdot g(n)$：“**至少**需要这么长时间”。Ω 可以描述整类算法：每一种基于比较的排序都是 $\Omega(n \log n)$。

两个示例函数。令 $f_1(n)$ 为 $n$ 的大于 1 的最小因子：对大多数 n 它很小（偶数为 2，3 的倍数为 3，……），但当 $n$ 为素数时会一路升到 $n$ 本身。令 $f_2(n) = n$，即一条直线。那么对所有 $n \ge 2$ 有 $f_1(n) \ge 2$，所以 $f_1 = \Omega(1)$，而 $f_2 = \Omega(n)$。

> 📘 **延伸阅读**：$f_1$ 正是试除法素性检验的步数：对大多数 n 很便宜，对素数则是线性的。

### 4.4 Big-Θ：紧界

$f(n)$ 是 $\Theta(g(n))$，若它既是 $O(g(n))$ 又是 $\Omega(g(n))$：“恰好需要这么长时间，忽略常数因子和低阶项。”**若最好的 Big-O 与 Big-Ω 界不一致，则 Big-Θ 无定义。**所以 $f_2(n) = \Theta(n)$，而 $f_1$（$O(n)$ 且 $\Omega(1)$）没有 Θ。

| 记号 | 界 | 定义（∃ $c, n_0 > 0$，∀ $n \ge n_0$） | 通俗说法 |
|---|---|---|---|
| $O(g)$ | 上界 | $f(n) \le c \cdot g(n)$ | 至多 |
| $\Omega(g)$ | 下界 | $f(n) \ge c \cdot g(n)$ | 至少 |
| $\Theta(g)$ | 紧界 | 两者都成立 | “恰好”，忽略常数 |

同样的记号既可以描述时间，也可以描述空间。

### 4.5 情形与增长率

这是两个独立的问题：**哪种情形？**（最好、平均、最坏输入）以及**增长得多快？**（O(1)、O(log n)、O(n)、O(n²)，……）。在长度为 n 的数组中进行线性查找：

| 情形 | 何时发生 | 比较次数 | 增长率 |
|---|---|---|---|
| 最好 | 目标是第一个元素 | 1 | O(1) |
| 平均 | 目标在中间 | n/2 | O(n) |
| 最坏 | 目标在最后或不存在 | n | O(n) |

> ⚠️ **易错点**：“Big-O = 最坏情形，Big-Ω = 最好情形”是**错误的**。先确定情形，再对它给出界：线性查找的最坏情形为 Θ(n)，最好情形为 Θ(1)。若未指明情形，则为 O(n) 且 Ω(1)，但没有 Θ。

### 4.6 练习

#### 从图中读出界

取 [4.3](#43-big-ω下界) 中定义的 $f_1(n)$ 与 $f_2(n)$，并令 $f(n) = \tfrac12 n^2 + 3n$，这是一条最终会超过任何直线 $c \cdot n$ 的曲线。

**(a)** 下列哪个可以作为 $f(n)$ 的 Big-O 中的 $g(n)$：$n$、$4n$、$n^2$？
**(b)** $f_1(n)$ 与 $f_2(n)$ 的 Big-Omega 分别是什么？
**(c)** $f_1(n)$ 与 $f_2(n)$ 的 Big-Theta 分别是什么？

<details>
<summary>解答</summary>

(a) 只有 $n^2$：任何直线的常数倍都无法始终位于增长更快的曲线之上；$n$ 与 $4n$ 本来就属于同一类。(b) $f_1 = \Omega(1)$（有无穷多个很小的值），$f_2 = \Omega(n)$。(c) $f_1$：O(n) 但 Ω(1)，所以 **Θ 无定义**；$f_2 = \Theta(n)$。

</details>

#### 简单任务的 Big-O、Big-Ω、Big-Θ

给定一个由 n 个三位整数组成、顺序随机的数组，用 Big-O、Big-Ω、Big-Θ 描述时间复杂度：(a) 1. 将所有元素打印到 `std::cout`；2. 在（未排序的）数组中查找某个数。(b) 给出下列函数的 Big-O：1. T(n) = 7n − 2000；2. T(n) = n³ + 46n² + 10000；3. T(n) = 3 log n + 5n。

> 提示：对于查找，请考虑最好和最坏情形分别是什么。

<details>
<summary>解答</summary>

| 任务 | O | Ω | Θ |
|---|---|---|---|
| 打印全部 | O(n) | Ω(n) | Θ(n)：每种输入都要访问全部 n 个元素 |
| 在未排序数组中查找 | O(n) | Ω(1) | 若不指明情形则无（最好 Θ(1)，最坏 Θ(n)） |

(b) 1. O(n)（−2000 只在 n 较小时有影响）。2. O(n³)。3. O(n)（log n 增长得比 n 慢）。

</details>

## 5. 常见的增长阶

几个函数几乎覆盖了所有算法。按增长从慢到快列出：

| 阶 | 名称 | 典型形状 | 例子 | n = 1,000 |
|---|---|---|---|---|
| $1$ | 常数 | 固定语句 | `a[i]` | 1 |
| $\log n$ | 对数 | 每步把范围减半 | 二分查找 | ≈10 |
| $n$ | 线性 | 一层循环 | 线性查找 | 1,000 |
| $n \log n$ | 线性对数 | 对半分再做线性工作 | 归并排序 | ≈10⁴ |
| $n^2$ | 平方 | 两层嵌套循环 | 2-Sum | 10⁶ |
| $n^3$ | 立方 | 三层嵌套循环 | 3-Sum | 10⁹ |
| $2^n$ | 指数 | 每个子集 | 子集和 | ≈10³⁰¹ |
| $n!$ | 阶乘 | 每种排列 | 暴力法求 TSP | 天文数字 |

> 📘 **延伸阅读**：网站 bigocheatsheet.com 把这些曲线并排绘出（绿色为 O(1) 与 O(log n)，黄色为 O(n)，橙色为 O(n log n)，红色为 O(n²)、O(2ⁿ) 与 O(n!)）。

## 6. 空间复杂度

**位**（bit）是 0 或 1，**字节**（byte）是 8 位。传统的 KB / MB / GB / TB 分别表示 $2^{10}$ / $2^{20}$ / $2^{30}$ / $2^{40}$ 字节（是 1,024，而不是 1,000）；表示这些二的幂的 IEC 名称是 KiB / MiB / GiB / TiB。

典型 C++ 类型的大小，`sizeof` 在 x86-64 Linux（g++ 13）上的实测值：

| 类型 | 典型值 | 实测 |
|---|---|---|
| `bool`、`char` | 1 字节 | 1 |
| `short` | 2 | 2 |
| `int`、`float` | 4 | 4 |
| `long` | 4 或 8 | 8 |
| `long long`、`double` | 8 | 8 |
| 指针（`int*`） | 64 位上为 8，32 位上为 4 | 8 |

- **静态数组**：只有元素的存储，没有额外开销。**动态数组**与**对象**：存储加上可变的开销。
- **指针**：在 64 位上为 8 字节。**引用**：大小没有保证（取决于实现）。

空间与时间使用同样的记号来分析：分配一个长度为 n 的 int 数组的算法使用 Θ(n) 内存；只保留几个计数器的算法使用 Θ(1)。

> ⚠️ **易错点**：在 64 位 Windows 上 `long` 是 4 字节；若需要确切的位宽，请使用 `std::int64_t`。

> 📘 **延伸阅读**：对象会为对齐而填充（algs4）。用 [§9](#9-完整实现) 中的程序测量，`struct { char c; double d; }` 为 **16** 字节，而不是 9。

## 7. 递归分析：递推式与递归树

### 7.1 为什么要分析递归

有些算法和数据结构用递归来写最自然，因此我们也需要像分析循环那样求出它们的运行时间。标准例子：

```cpp
long factorial(int n) {
  if (n == 0)
    return 1;
  else
    return n * factorial(n - 1);
}
```

**最坏情形的时间复杂度是多少？** O(n)。`factorial(n)` 总共做 n 次乘法与 n + 1 次调用（`factorial(n)`、`factorial(n-1)`，……，`factorial(0)`），每次调用做常数量的工作。

> ⚠️ **易错点**：“没有循环，所以是 O(1)”是错的。工作隐藏在递归调用之中：`factorial(10)` 显然比 `factorial(5)` 做得更多。应始终问：会发生多少次调用，每次调用的代价是多少。

### 7.2 两步法

求递归算法的时间复杂度：

1. **建立递推式**：一个表达运行时间 T(n) 的方程，
   - 用一个或多个规模小于 n 的子问题来表示，
   - 再加上递归调用之外所做的任何额外工作。
2. **（近似地）求解递推式**，使用以下两种方法之一：
   - **方法 A，递归树**（[7.4](#74-方法-a阶乘的递归树) 到 [7.6](#76-读懂递归树三种形状)）；
   - **方法 B，主定理**（[§8](#8-主定理)）。

每个递推式还需要一个**基底情况**（例如 T(0) 或 T(1)），其值为常数。

### 7.3 建立递推式：阶乘

对于上面的 `factorial` 函数：

```text
T(0) = a
T(n) = b + T(n - 1)      for n > 0
```

- **T(0)** 是 `n == 0` 时的时间；**a** 是检查 `n == 0` 并返回 1 所需的常数时间。
- 对于 **n > 0**，**b** 是除递归调用之外全部工作的常数时间（判断、`n - 1`、乘法、返回）。
- **T(n − 1)** 是递归调用的时间，由同一递推式描述。

从代码读出递推式：数出递归调用的次数（这里是一次），写出每次调用得到的规模（这里是 n − 1），再加上函数体其余部分的代价（这里是常数 b）。

> 📘 **延伸阅读**（Thornton，*Asymptotic Analysis of Recursion*）：另一种求解方法是**逐次代入**。不断代入，直到出现规律：
> T(n) = b + T(n−1) = 2b + T(n−2) = 3b + T(n−3) = … = jb + T(n−j).
> （该规律可用归纳法对所有 j 证明。）取 j = n 到达基底情况：T(n) = nb + T(0) = **nb + a**，它线性增长，因此 T(n) 为 Θ(n)。下一节的递归树通过画图得到同样的求和。

### 7.4 方法 A：阶乘的递归树

为每次调用画一个节点，把该调用在其递归调用*之外*所做的工作标在旁边，然后把所有值加起来。对于 `factorial(5)`，这棵“树”是一条链：

| 调用 | 层 | 递推式项 | 该节点的工作量 |
|---|---|---|---|
| `factorial(5) = 5 * factorial(4)` | 0 | T(n) | b |
| `factorial(4) = 4 * factorial(3)` | 1 | T(n−1) | b |
| `factorial(3) = 3 * factorial(2)` | 2 | T(n−2) | b |
| `factorial(2) = 2 * factorial(1)` | 3 | T(n−3) | b |
| `factorial(1) = 1 * factorial(0)` | 4 | T(n−4) | b |
| `factorial(0) = 1` | 基底 | T(0) = 常数 | a |

- 共有 **n 层**（另加基底情况）。
- 每层耗时常数 b。
- T(n) = 层数 × 每层时间 = n·b（+ a）⇒ **O(n)**。

下面逐步演示（← / → 键在演示获得焦点时可用）：

```viz recursion-tree
{"title": "factorial(5) 的递归树", "recurrence": "T(n) = b + T(n-1)", "n": 5, "base": "a", "code": "factorial"}
```

在真实代码中计数调用，结果一致：在 `factorial` 开头加入 `++calls`，输出

```text
factorial(5) = 120, calls = 6
```

即 n + 1 = 6 次调用：五次代价为 b，一次基底情况代价为 a。

### 7.5 分治递推式的递归树

考虑一个算法：把输入对半分，对两半各递归一次，并在每次调用中做线性工作：

```text
T(n) = 2T(n/2) + n
T(1) = c,  where c is a constant
```

**方法的规则：** 把每个操作记到执行它的函数调用（树节点）上。在更深的递归调用中完成的工作，单独记在*它们的*节点上。因此，输入长度为 m 的节点记为 m（即 “+ n” 项在它自己的规模上的取值），绝不多记。

| 层 | 调用数 | 每次调用的输入规模 | 每次调用的工作量 | 该层合计 |
|---|---|---|---|---|
| 0 | 1 | n | n | n |
| 1 | 2 | n/2 | n/2 | n |
| 2 | 4 | n/4 | n/4 | n |
| 3 | 8 | n/8 | n/8 | n |
| … | … | … | … | n |
| log₂ n（叶子） | 2^(log₂ n) = n | 1 | c | c·n |

- 规模每层减半，因此经过 **log₂ n** 次减半后达到 1。树高为 log₂ n，因此计入根层（第 0 层）与叶子层，共有 **log₂ n + 1 层**。
- 节点数每层翻倍，所以叶子层有 2^(log₂ n) = **n 个叶子**，每个都是基底情况 T(1) = c。
- 每个非叶层的合计为 **n**：2^i 次调用，各 n/2^i。
- 总计：n·log₂ n + c·n ⇒ **O(n log n)**。

下面逐步演示。输入框允许你输入任何形如 aT(n/b) + f(n) 的递推式：

```viz recursion-tree
{"title": "T(n) = 2T(n/2) + n，n = 8 时的图", "recurrence": "T(n) = 2T(n/2) + n", "n": 8, "interactive": true}
```

这是一个具有完全相同形状的真实函数，每个 “+ n” 步计一个单位，每个基底情况也计一个单位（c = 1）：

```cpp
long work = 0;

void unknown(int n) {                    // T(n) = 2T(n/2) + n
  if (n == 1) { ++work; return; }        // base case: c
  for (int i = 0; i < n; ++i) ++work;    // the "+ n"
  unknown(n / 2);
  unknown(n / 2);
}
```

```text
unknown(8): work = 32  (n lg n + n = 32)
unknown(16): work = 80  (n lg n + n = 80)
unknown(1024): work = 11264  (n lg n + n = 11264)
```

每个结果都与 n·log₂ n + n 一致：8·3 + 8 = 32，16·4 + 16 = 80，1024·10 + 1024 = 11264。

> 💡 **关键洞见**：画递归树需要三个数：层数、每层的节点数，以及每个节点的工作量。总量等于各层合计之和。

### 7.6 读懂递归树：三种形状

只改变递推式，同样的方法会给出三种不同的答案，取决于工作量位于何处：

| 递推式 | 每层节点数 | 每层工作量 | 层数 | 总计 |
|---|---|---|---|---|
| T(n) = T(n/2) + c | 1 | c | log₂ n + 1 | c(log₂ n + 1) = **O(log n)** |
| T(n) = 2T(n/2) + c | 2^i | 2^i · c（每层翻倍） | log₂ n + 1 | c(1 + 2 + … + n) = c(2n − 1) = **O(n)** |
| T(n) = 2T(n/2) + n | 2^i | n（恒定） | log₂ n + 1 | n log₂ n + cn = **O(n log n)** |

第一行是每层只有一个节点的链：**二分查找**恰好具有这一递推式，因为每次调用做常数工作（计算 `mid` 与一次比较），并对一半范围进行一次递归调用：

```cpp
bool binarySearch(const int* arr, int lo, int hi, int target) {
  if (lo > hi) return false;             // empty range
  int mid = lo + (hi - lo) / 2;
  if (arr[mid] == target) return true;
  if (target < arr[mid])
    return binarySearch(arr, lo, mid - 1, target);
  return binarySearch(arr, mid + 1, hi, target);
}
```

在一个 16 元素数组中查找一个不存在的值（最坏情形），共进行 6 次调用：范围大小依次为 16、8、4、2、1，然后是空范围。即 log₂ 16 + 1 = 5 层，外加本版本作为基底情况使用的空范围调用：

```text
binarySearch miss in 16 elements: found=0, calls=6
```

第二行说明：每个节点的工作量为常数，但当节点数在每层翻倍时，总量仍可以是线性的：工作量每层翻倍，所以叶子占主导。两个递推式 T(n/2) + c 与 2T(n/2) + c 只在 “T” 与 “2T” 上不同，仅此一点就把答案从 log n 变为 n。下面以 n = 16 检验求和（31c = c(2·16 − 1)）：

```viz recursion-tree
{"title": "T(n) = 2T(n/2) + c，n = 16 时的图", "recurrence": "T(n) = 2T(n/2) + c", "n": 16}
```

### 7.7 练习

#### 有多少层与叶子？

对于如下递推式的树：

```text
T(n) = 2T(n/2) + n
T(1) = c, where c is a constant
```

有多少层，多少个叶子？

> 提示：你最多能把 n 对半折几次才能到达 1？

<details>
<summary>解答</summary>

输入规模每层减半，减到 1 需要 log₂ n 次减半。因此树高为 log₂ n，若计入根层（第 0 层）与叶子层，共有 **log₂ n + 1 层**。节点数每层翻倍，所以叶子层有 2^(log₂ n) = **n 个叶子**。每个非叶层的合计为 n，叶子层的合计为 c·n，因此 T(n) = n log₂ n + cn = O(n log n)。见 [7.5](#75-分治递推式的递归树)。

</details>

#### 二分查找与递归树

用递归树方法确定二分查找的 Big-O 时间复杂度：

```text
T(n) = T(n/2) + c
T(1) = c
```

> 提示：每个节点做多少次递归调用？

<details>
<summary>解答</summary>

**O(log n)。** 每次调用只做**一次**递归调用，作用于一半的范围，并做常数工作 c。这棵“树”是一条链，每层一个节点。共有 log₂ n + 1 层，每层代价为 c，因此 T(n) = c(log₂ n + 1) = **O(log n)**。[7.6](#76-读懂递归树三种形状) 中的插桩 `binarySearch` 对 16 个元素进行了 6 次调用，证实了这一点。

</details>

#### 常数工作、两个子问题

用递归树确定下列递推式的 Big-O 时间复杂度：

```text
T(n) = 2T(n/2) + c
```

> 提示：写出各层合计 c、2c、4c、……，看看哪一端的树占主导。

<details>
<summary>解答</summary>

**O(n)。** 第 i 层有 2^i 个节点，每个耗时 c，因此各层合计为 c、2c、4c、……、n·c（即 n 个叶子）。这个等比数列的和为 c(2n − 1) = **O(n)**。工作量每层翻倍，所以叶子占主导；[7.6](#76-读懂递归树三种形状) 中 n = 16 的树显示总量为 31c。

</details>

## 8. 主定理

### 8.1 公式

主定理是一个公式，用于求解所有子问题规模都相同的递推式。它把递归树方法打包成即插即用的结果，因此比画树更快。

设 $T(n) = a \cdot T(n/b) + O(n^d)$，则

$$
T(n) = \begin{cases}
O(n^d \log n) & \text{if } a = b^d \\
O(n^d) & \text{if } a < b^d \\
O(n^{\log_b a}) & \text{if } a > b^d
\end{cases}
$$

三个参数：

- **a**：子问题的个数（每次调用的递归调用数）；
- **b**：输入规模缩小的因子（每个子问题的规模为 n/b）；
- **d**：非递归工作为 n^d，即创建所有子问题并合并其解的工作。

使用时，读出 a、b、d，计算 b^d，并将它与 a 比较。

> ⚠️ **易错点**：常数额外工作，即 O(1) 或“+ c”，意味着 **d = 0**（n⁰ = 1），因此 b^d = 1。在 T(n) = 2T(n/2) + c 中，比较的是 2 与 1，而不是 2 与 2。

### 8.2 为什么是三种情形：工作量在哪里

递归树揭示了这个公式的由来。第 0 层有 1 个节点，做 f(n)。第 1 层有 a 个节点，各做 f(n/b)。第 i 层有 **a^i** 个节点，处理规模为 **n/b^i** 的输入。底层有 a^(log_b n) = n^(log_b a) 个叶子，各做 f(1)。

若 f(n) = n^d，则第 i 层的代价为 a^i · (n/b^i)^d = n^d · (a/b^d)^i。因此每向下一层，该层的合计就乘以 **a / b^d**：

| 情形 | 逐层向下的合计 | 直观理解 | 结果 |
|---|---|---|---|
| a = b^d | 保持不变（每层 n^d，共 log_b n + 1 层） | 工作量在树上**均衡**分布 | O(n^d log n) |
| a < b^d | 按几何级数递减 | 根部的工作量**占主导** | O(n^d) |
| a > b^d | 按几何级数递增 | 叶子处的工作量**占主导** | O(n^(log_b a))，即叶子数 |

下面演示一个叶子占主导的例子；在输入框中输入其他递推式，可以看到另外两种情形：

```viz recursion-tree
{"title": "T(n) = 4T(n/2) + n，n = 4 时的图", "recurrence": "T(n) = 4T(n/2) + n", "n": 4, "interactive": true}
```

### 8.3 典型例题

| 递推式 | a | b | d | a 与 b^d | T(n) |
|---|---|---|---|---|---|
| T(n) = 4T(n/2) + O(n) | 4 | 2 | 1 | 4 > 2 | O(n^(log₂ 4)) = **O(n²)** |
| T(n) = 3T(n/2) + O(n) | 3 | 2 | 1 | 3 > 2 | O(n^(log₂ 3)) ≈ **O(n^1.6)**（log₂ 3 ≈ 1.585） |
| T(n) = 2T(n/2) + O(n) | 2 | 2 | 1 | 2 = 2 | **O(n log n)**，见 [7.5](#75-分治递推式的递归树) |

用 [§2](#2-运行时间的实测分析) 中的倍增比做一个数值检验：若 T(n) 按 n^e 增长，则 T(2n)/T(n) → 2^e。用 [§9](#9-完整实现) 中的程序，在 n = 16384 处精确计算各递推式：

```text
T(n) = 2T(n/2) + n  : T(2n)/T(n) = 2.13333
T(n) = 4T(n/2) + n  : T(2n)/T(n) = 4.00006
T(n) = 4T(n/2) + n^2: T(2n)/T(n) = 4.26667
T(n) = 4T(n/2) + n^3: T(2n)/T(n) = 8.00012
T(n) = T(n/2) + n   : T(2n)/T(n) = 2.00003
T(n) = 2T(n/2) + 1  : T(2n)/T(n) = 2.00003
```

比值对 n² 约为 4，对 n³ 约为 8；n log n 与 n² log n 两种情形略高于 2 与 4，是因为多出了对数因子。

### 8.4 不适用的情形

**主定理能否求解 T(n) = T(n/3) + T(2n/3) + n？** **不能。** 两个子问题的规模不同（n/3 与 2n/3），因此不存在单一的 b。应改用递归树：每个完整层的代价至多为 n（同一层上各规模之和至多为 n）。最长路径每步缩小为 2/3，因此约有 log_{3/2} n 层。总计 O(n log n)。

> ⚠️ **易错点**：主定理要求形如 a·T(n/b) + n^d 且子问题规模相等的递推式。T(n−1) 型的递推式（如阶乘）和不均匀的划分不在其适用范围内。这些情形应使用递归树（或代入法）。

### 8.5 练习

#### 用主定理求解八个递推式

用主定理求解 $T(n) = a \cdot T(n/b) + O(n^d)$：

**(a)** 写出二分查找的递推式，并用主定理求解。

**(b)** T(n) = T(n/2) + O(n)

**(c)** T(n) = 2T(n/2) + O(1)

**(d)** T(n) = 2T(n/2) + O(n)

**(e)** T(n) = 4T(n/2) + n

**(f)** T(n) = 4T(n/2) + n²

**(g)** T(n) = 4T(n/2) + n³

**(h)** T(n) = 3T(2n/3) + n

> 提示：对每一项写出 a、b、d，然后比较 a 与 b^d。

<details>
<summary>解答</summary>

| | 递推式 | a | b | d | b^d | 情形 | T(n) |
|---|---|---|---|---|---|---|---|
| (a) | T(n) = T(n/2) + O(1) | 1 | 2 | 0 | 1 | a = b^d | O(n⁰ log n) = **O(log n)** |
| (b) | T(n) = T(n/2) + O(n) | 1 | 2 | 1 | 2 | a < b^d | **O(n)** |
| (c) | T(n) = 2T(n/2) + O(1) | 2 | 2 | 0 | 1 | a > b^d | O(n^(log₂ 2)) = **O(n)** |
| (d) | T(n) = 2T(n/2) + O(n) | 2 | 2 | 1 | 2 | a = b^d | **O(n log n)** |
| (e) | T(n) = 4T(n/2) + n | 4 | 2 | 1 | 2 | a > b^d | O(n^(log₂ 4)) = **O(n²)** |
| (f) | T(n) = 4T(n/2) + n² | 4 | 2 | 2 | 4 | a = b^d | **O(n² log n)** |
| (g) | T(n) = 4T(n/2) + n³ | 4 | 2 | 3 | 8 | a < b^d | **O(n³)** |
| (h) | T(n) = 3T(2n/3) + n | 3 | 3/2 | 1 | 1.5 | a > b^d | O(n^(log_{3/2} 3)) ≈ **O(n^2.71)** |

关键陷阱：

- (a) 与 (c) 的额外工作为 O(1)，因此 **d = 0**。(a) 与 [7.6](#76-读懂递归树三种形状) 中二分查找的递归树一致。
- (c) 与 2T(n/2) + c 的递归树结论一致：O(n)。
- (e) 至 (g) 保持 a = 4、b = 2，只改变 d，从而依次经过三种情形：叶子主导、均衡、根部主导。
- (h)：规模缩小*到* 2n/3，因此缩小因子为 b = n ÷ (2n/3) = **3/2**，而不是 2/3 或 3。于是 log_{3/2} 3 = ln 3 / ln 1.5 ≈ 1.0986 / 0.4055 ≈ 2.71。

</details>

## 9. 完整实现

两个程序覆盖了本章内容。`counting.cpp` 包含插桩版的 1-Sum 与 2-Sum（操作计数器）、3-Sum、带调用与工作计数器的 `factorial` 与 `unknown`、带调用计数器的 `binarySearch`、用于 [8.3](#83-典型例题) 中倍增比的 $T(n) = aT(n/b) + n^d$ 精确求值器，以及 `sizeof` 测量。`doubling.cpp` 是 [2.3](#23-倍增假设) 中的 3-SUM 倍增实验。

```cpp
#include <cmath>
#include <cstddef>
#include <iostream>
#include <vector>

// ---------------------------------------------------------------------------
// Operation counting: 1-Sum, 2-Sum, 3-Sum
// ---------------------------------------------------------------------------
struct Counts {
  long decl = 0, assign = 0, less = 0, eq = 0, access = 0, incr = 0;
};

// How many single numbers equal 0?
int oneSum(const std::vector<int>& a, Counts& c) {
  size_t n = a.size();
  int count = 0;                     c.decl += 2; c.assign += 2;   // count, i; count = 0, i = 0
  for (size_t i = 0; ; i++) {
    c.less++;                                                      // i < n
    if (!(i < n)) break;
    c.eq++; c.access++;                                            // a[i] == 0
    if (a[i] == 0) { count++; c.incr++; }
    c.incr++;                                                      // i++
  }
  return count;
}

// How many unordered pairs sum to 0?
int twoSum(const std::vector<int>& a, Counts& c) {
  size_t n = a.size();
  int count = 0;                     c.decl += 2; c.assign += 2;   // count, i; count = 0, i = 0
  for (size_t i = 0; ; i++) {
    c.less++;                                                      // i < n
    if (!(i < n)) break;
    c.decl++; c.assign++;                                          // size_t j = i + 1
    for (size_t j = i + 1; ; j++) {
      c.less++;                                                    // j < n
      if (!(j < n)) break;
      c.eq++; c.access += 2;                                       // a[i] + a[j] == 0
      if (a[i] + a[j] == 0) { count++; c.incr++; }
      c.incr++;                                                    // j++
    }
    c.incr++;                                                      // i++
  }
  return count;
}

// How many unordered triplets sum to 0?  Also counts array accesses.
int threeSum(const std::vector<int>& a, long& accesses) {
  size_t n = a.size();
  int count = 0;
  accesses = 0;
  for (size_t i = 0; i < n; i++)
    for (size_t j = i + 1; j < n; j++)
      for (size_t k = j + 1; k < n; k++) {
        accesses += 3;
        if (a[i] + a[j] + a[k] == 0) count++;
      }
  return count;
}

void show(const char* label, const Counts& c) {
  std::cout << label << " decl=" << c.decl << " assign=" << c.assign << " less=" << c.less
            << " eq=" << c.eq << " access=" << c.access << " incr=" << c.incr << '\n';
}

// ---------------------------------------------------------------------------
// Recursion: factorial, T(n) = 2T(n/2) + n, binary search
// ---------------------------------------------------------------------------
long calls = 0;

long factorial(int n) {
  ++calls;
  if (n == 0) return 1;
  return n * factorial(n - 1);
}

long work = 0;

void unknown(int n) {                    // T(n) = 2T(n/2) + n
  if (n == 1) { ++work; return; }        // base case: c = 1
  for (int i = 0; i < n; ++i) ++work;    // the "+ n"
  unknown(n / 2);
  unknown(n / 2);
}

int bsCalls = 0;

bool binarySearch(const int* arr, int lo, int hi, int target) {
  ++bsCalls;
  if (lo > hi) return false;             // empty range
  int mid = lo + (hi - lo) / 2;
  if (arr[mid] == target) return true;
  if (target < arr[mid]) return binarySearch(arr, lo, mid - 1, target);
  return binarySearch(arr, mid + 1, hi, target);
}

// T(n) = a*T(n/b) + n^d evaluated exactly (real division), T(small) = 1.
double evalT(double n, double a, double b, double d) {
  if (n <= 1) return 1;
  return a * evalT(n / b, a, b, d) + std::pow(n, d);
}

void growth(const char* label, double a, double b, double d) {
  double n = 1 << 14;
  double ratio = evalT(2 * n, a, b, d) / evalT(n, a, b, d);   // doubling ratio -> 2^exponent
  std::cout << label << ": T(2n)/T(n) = " << ratio << "\n";
}

int main() {
  // 1-Sum, n = 10
  std::vector<int> v(10);
  for (int i = 0; i < 10; i++) v[i] = i + 1;
  Counts c1;
  oneSum(v, c1);
  show("1-Sum, no zero: ", c1);
  v[4] = 0;
  Counts c2;
  oneSum(v, c2);
  show("1-Sum, one zero:", c2);

  // 2-Sum, n = 10, no pairs
  std::vector<int> w(10);
  for (int i = 0; i < 10; i++) w[i] = i + 1;
  Counts c3;
  int pairs = twoSum(w, c3);
  std::cout << "2-Sum n=10: pairs=" << pairs << '\n';
  show("  ", c3);
  long n = 10;
  std::cout << "  formulas: n+2=" << n + 2 << " (n+1)(n+2)/2=" << (n + 1) * (n + 2) / 2
            << " n(n-1)/2=" << n * (n - 1) / 2 << " n(n-1)=" << n * (n - 1)
            << " n(n+1)/2=" << n * (n + 1) / 2 << " n^2=" << n * n << '\n';

  // 3-Sum on the example input
  std::vector<int> t = {30, -40, -20, -10, 40, 0, 10, 5};
  long acc;
  std::cout << "3-Sum example: triples=" << threeSum(t, acc) << ", array accesses=" << acc
            << " (3 * C(8,3) = " << 3 * 56 << ")\n";

  // factorial
  calls = 0;
  std::cout << "factorial(5) = " << factorial(5) << ", calls = " << calls << '\n';

  // unknown
  for (int m : {8, 16, 1024}) {
    work = 0;
    unknown(m);
    int lg = 0;
    while ((1 << lg) < m) lg++;
    std::cout << "unknown(" << m << "): work = " << work << "  (n lg n + n = " << m * lg + m << ")\n";
  }

  // binary search, worst case
  int arr[16];
  for (int i = 0; i < 16; i++) arr[i] = 2 * i;
  bsCalls = 0;
  bool found = binarySearch(arr, 0, 15, 99);
  std::cout << "binarySearch miss in 16 elements: found=" << found << ", calls=" << bsCalls << '\n';

  // doubling ratios for master-theorem recurrences
  growth("T(n) = 2T(n/2) + n  ", 2, 2, 1);
  growth("T(n) = 4T(n/2) + n  ", 4, 2, 1);
  growth("T(n) = 4T(n/2) + n^2", 4, 2, 2);
  growth("T(n) = 4T(n/2) + n^3", 4, 2, 3);
  growth("T(n) = T(n/2) + n   ", 1, 2, 1);
  growth("T(n) = 2T(n/2) + 1  ", 2, 2, 0);

  // sizes
  std::cout << "sizeof: bool " << sizeof(bool) << ", char " << sizeof(char) << ", short " << sizeof(short)
            << ", int " << sizeof(int) << ", float " << sizeof(float) << ", long " << sizeof(long)
            << ", long long " << sizeof(long long) << ", double " << sizeof(double)
            << ", int* " << sizeof(int*) << '\n';
  struct Padded { char c; double d; };
  std::cout << "sizeof(struct { char c; double d; }) = " << sizeof(Padded) << '\n';
}
```

程序输出：

```text
1-Sum, no zero:  decl=2 assign=2 less=11 eq=10 access=10 incr=10
1-Sum, one zero: decl=2 assign=2 less=11 eq=10 access=10 incr=11
2-Sum n=10: pairs=0
   decl=12 assign=12 less=66 eq=45 access=90 incr=55
  formulas: n+2=12 (n+1)(n+2)/2=66 n(n-1)/2=45 n(n-1)=90 n(n+1)/2=55 n^2=100
3-Sum example: triples=4, array accesses=168 (3 * C(8,3) = 168)
factorial(5) = 120, calls = 6
unknown(8): work = 32  (n lg n + n = 32)
unknown(16): work = 80  (n lg n + n = 80)
unknown(1024): work = 11264  (n lg n + n = 11264)
binarySearch miss in 16 elements: found=0, calls=6
T(n) = 2T(n/2) + n  : T(2n)/T(n) = 2.13333
T(n) = 4T(n/2) + n  : T(2n)/T(n) = 4.00006
T(n) = 4T(n/2) + n^2: T(2n)/T(n) = 4.26667
T(n) = 4T(n/2) + n^3: T(2n)/T(n) = 8.00012
T(n) = T(n/2) + n   : T(2n)/T(n) = 2.00003
T(n) = 2T(n/2) + 1  : T(2n)/T(n) = 2.00003
sizeof: bool 1, char 1, short 2, int 4, float 4, long 8, long long 8, double 8, int* 8
sizeof(struct { char c; double d; }) = 16
```

双倍实验对随机整数（固定种子）计时暴力 3-SUM，并输出倍增比及其以 2 为底的对数，后者用于估计 b。请使用 `-O2` 编译以获得有意义的计时（sanitizer 会使其慢数倍）：

```cpp
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <iomanip>
#include <iostream>
#include <random>
#include <vector>

// Brute-force 3-Sum: how many unordered triplets sum to 0?
long threeSum(const std::vector<int>& a) {
  size_t n = a.size();
  long count = 0;
  for (size_t i = 0; i < n; i++)
    for (size_t j = i + 1; j < n; j++)
      for (size_t k = j + 1; k < n; k++)
        if (a[i] + a[j] + a[k] == 0) count++;
  return count;
}

int main() {
  std::mt19937 gen(46);
  std::uniform_int_distribution<int> dist(-1000000, 1000000);
  double prev = 0;
  std::cout << std::fixed << std::setprecision(3);
  std::cout << "      n   triples   time (s)   T(n)/T(n/2)   lg ratio\n";
  for (size_t n = 250; n <= 4000; n *= 2) {
    std::vector<int> a(n);
    for (int& x : a) x = dist(gen);
    double best = 1e30;
    long triples = 0;
    for (int run = 0; run < (n <= 1000 ? 3 : 1); run++) {      // min of several runs for small n
      auto t0 = std::chrono::steady_clock::now();
      triples = threeSum(a);
      auto t1 = std::chrono::steady_clock::now();
      best = std::min(best, std::chrono::duration<double>(t1 - t0).count());
    }
    std::cout << std::setw(7) << n << std::setw(10) << triples << std::setw(11) << best;
    if (prev > 0) {
      double ratio = best / prev;
      std::cout << std::setw(14) << ratio << std::setw(11) << std::log2(ratio);
    }
    std::cout << '\n';
    prev = best;
  }
}
```

一次运行的输出（每次运行与每台机器上的计时各不相同；比值聚集在 8 附近，因此 b ≈ 3）：

```text
      n   triples   time (s)   T(n)/T(n/2)   lg ratio
    250         0      0.001
    500         7      0.009         7.671      2.939
   1000        71      0.056         6.414      2.681
   2000       467      0.497         8.818      3.140
   4000      4012      3.616         7.271      2.862
```

## 10. 速查与五个要点

| 工具 | 给出什么 | 关键事实 |
|---|---|---|
| 倍增测试 | 指数 b（T(n) = a·n^b） | T(n)/T(n/2) → 2^b；a 取决于机器，b 不取决于机器 |
| 代价模型 + 波浪号 | 操作计数的首项 | 2-Sum ~ n² 次数组访问；3-Sum ~ n³/2 |
| Big-O / Ω / Θ | 上界 / 下界 / 紧界 | 仅当 O 与 Ω 一致时才有 Θ；情形（最好/最坏）是另一个独立的选择 |
| 增长阶 | 1 < log n < n < n log n < n² < n³ < 2ⁿ < n! | 增长越慢，算法越好 |
| 递推式（阶乘） | T(n) = b + T(n−1) | O(n) |
| 递推式（对半） | T(n) = T(n/2) + c；2T(n/2) + c；2T(n/2) + n | O(log n)；O(n)；O(n log n) |
| 主定理 | T(n) = aT(n/b) + O(n^d) | a = b^d：O(n^d log n)；a < b^d：O(n^d)；a > b^d：O(n^(log_b a)) |

**必须记住的 5 件事**

1. 运行时间服从幂律 T(n) = a·n^b；倍增比 2^b 揭示 b，只有常数 a 取决于硬件。
2. 总时间 = Σ 代价 × 频率；选定一种代价模型（如数组访问），并保留波浪号的首项：2-Sum ~ n²，3-Sum ~ n³。
3. Big-O 是上界，Big-Ω 是下界，Big-Θ 是紧界（仅当两者一致时才存在）；最好/平均/最坏情形与界是两个独立的问题。
4. 递归算法需要一个递推式（基底情形 + 子问题 + 外部工作）；用递归树求解：层数 × 每层节点数 × 每个节点的工作量。
5. 主定理适用于 T(n) = aT(n/b) + O(n^d)：比较 a 与 b^d（相等：n^d log n；较小：n^d；较大：n^(log_b a)）；常数额外工作意味着 d = 0，而子问题规模不均或 T(n−1) 型则需改用递归树。

