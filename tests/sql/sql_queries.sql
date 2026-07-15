-- SCENARIO 1: Round-Trip Transfer Detection

CREATE TABLE transactions (
    transaction_id  SERIAL PRIMARY KEY,
    sender_account  VARCHAR(20) NOT NULL,
    receiver_account VARCHAR(20) NOT NULL,
    amount          DECIMAL(15, 2) NOT NULL,
    transaction_time TIMESTAMP NOT NULL
);

INSERT INTO transactions (sender_account, receiver_account, amount, transaction_time) VALUES
('ACC_A', 'ACC_B', 1000.00, '2024-01-15 10:00:00'),
('ACC_B', 'ACC_A',  950.00, '2024-01-15 20:00:00'),
('ACC_A', 'ACC_B', 5000.00, '2024-01-16 09:00:00'),
('ACC_B', 'ACC_A', 6000.00, '2024-01-16 12:00:00'),
('ACC_C', 'ACC_D',  200.00, '2024-01-17 08:00:00'),
('ACC_D', 'ACC_C',  198.00, '2024-01-18 15:00:00');

SELECT
    t1.transaction_id  AS outgoing_txn_id,
    t1.sender_account  AS account_a,
    t1.receiver_account AS account_b,
    t1.amount          AS outgoing_amount,
    t2.transaction_id  AS return_txn_id,
    t2.amount          AS return_amount,
    t1.transaction_time AS outgoing_time,
    t2.transaction_time AS return_time,
    TIMESTAMPDIFF(HOUR, t1.transaction_time, t2.transaction_time) AS hours_between
FROM transactions t1
JOIN transactions t2
    ON  t1.sender_account    = t2.receiver_account
    AND t1.receiver_account  = t2.sender_account
    AND t2.transaction_time  > t1.transaction_time
    AND t2.transaction_time <= t1.transaction_time + INTERVAL 24 HOUR
    AND t2.amount BETWEEN t1.amount * 0.90 AND t1.amount * 1.10
ORDER BY t1.transaction_time;

-- SCENARIO 2: IPL Player Performance Streaks

CREATE TABLE ipl_performances (
    performance_id  SERIAL PRIMARY KEY,
    player_name     VARCHAR(100) NOT NULL,
    match_date      DATE NOT NULL,
    match_id        INT NOT NULL,
    runs_scored     INT NOT NULL
);

INSERT INTO ipl_performances (player_name, match_date, match_id, runs_scored) VALUES
('Virat Kohli',  '2024-03-22', 101, 45),
('Virat Kohli',  '2024-03-24', 102, 72),
('Virat Kohli',  '2024-03-26', 103, 33),
('Virat Kohli',  '2024-03-28', 104, 12),
('Rohit Sharma', '2024-03-22', 101, 28),
('Rohit Sharma', '2024-03-24', 102, 55),
('Rohit Sharma', '2024-03-26', 103, 61),
('Rohit Sharma', '2024-03-28', 104, 44),
('KL Rahul',     '2024-04-01', 110, 31),
('KL Rahul',     '2024-04-03', 111, 30),
('KL Rahul',     '2024-04-05', 112, 55);

WITH ranked AS (
    SELECT
        player_name,
        match_date,
        match_id,
        runs_scored,
        ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY match_date) -
        ROW_NUMBER() OVER (PARTITION BY player_name, CAST((runs_scored >= 30) AS UNSIGNED) ORDER BY match_date) AS grp
    FROM ipl_performances
    WHERE YEAR(match_date) = 2024
),
streaks AS (
    SELECT
        player_name,
        MIN(match_date) AS streak_start,
        MAX(match_date) AS streak_end,
        COUNT(*)        AS consecutive_matches
    FROM ranked
    WHERE runs_scored >= 30
    GROUP BY player_name, grp
    HAVING COUNT(*) >= 3
)
SELECT
    player_name,
    streak_start AS scoring_streak_commenced,
    streak_end,
    consecutive_matches
FROM streaks
ORDER BY player_name, streak_start;