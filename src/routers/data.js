


var bfCount = `select count(1) as count from aact_trx_actlog_bf where trx_il = trunc(sysdate)`;
var checkCloseBranch = `select b.enm, a.br_no, to_char(a.open_il, 'YYYY/MM/DD') as open_il , a.bon_clsgb, a.CLS_BIT
                        from aact_acc_clsbr a, acom_bix_base b
                        where a.br_no = b.br_no
                        and tr_il = trunc(sysdate)
                        order by a.cls_bit desc`;

var expenseVBudget = `SELECT * FROM (
    SELECT T1.BUSI_CD,
           T1.MNG_BR,
           T1.ASSIGN_AMT + ADD_AMT - ADD_CAMT + PLUS_AMT - MINUS_AMT AS TOT_BUDGET,
           T2.DR_AMT - T2.CR_AMT AS TOT_EXPENSE,
           T1.TOTAL_AMT -
           (T1.ASSIGN_AMT + ADD_AMT - ADD_CAMT + PLUS_AMT - MINUS_AMT) +
           (T2.DR_AMT - T2.CR_AMT) AS DIFF
      FROM (SELECT *
              FROM ACOM_EPB_BASE A
             WHERE A.MNG_YY = '2022'
               AND A.BUSI_CD IN (SELECT CODE
                                   FROM ACOM_COMH_CODE A
                                  WHERE A.TYPE = 'F162'
                                    AND A.CODE3 = '2')) T1,
           (SELECT B.ETC5 AS BUSI_CD,
                   A.MNG_BR,
                   SUM(A.DR_AMT) AS DR_AMT,
                   SUM(A.CR_AMT) AS CR_AMT
              FROM ACOM_EPB_BASE A, ACOM_COMH_CODE B
             WHERE A.MNG_YY = '2022'
               AND B.TYPE = 'F162'
               AND B.CODE3 = '3'
               AND A.BUSI_CD = B.CODE
             GROUP BY B.ETC5, A.MNG_BR) T2
     WHERE T1.MNG_BR = T2.MNG_BR
       AND T1.BUSI_CD = T2.BUSI_CD
     ORDER BY T1.BUSI_CD, T1.MNG_BR)
     WHERE MNG_BR NOT IN ('4101','1206','1107','1405') -- CABANG 4101 SUDAH TUTUP)
     AND DIFF <> 0
    `;

var allocationCollateral = { name : 'Allocation Collateral', query : `
SELECT  *
FROM    ACOM_BAT_PROCLST
WHERE   PROC_BRNO = '0888'
AND     PROC_DT   = TRUNC(SYSDATE)-1
AND     JOB_ID    LIKE 'dmb%'
AND     SEQ_NO    = 0
AND     PROC_STS  <> 2
`};

var checkBatchJob = { name : 'Check Batch Job', query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
CASE 
WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
CASE 
WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
(
SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= TRUNC(SYSDATE) AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
) C
WHERE PROC_STS = '9' --STATUS ERROR
AND NOT 
(RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
ORDER BY C.PROC_DT, C.STR_TM`
} 

var checkNplAcrualHaveNormalAccrualBalance = `SELECT /*+PARALLEL(XX 16)+*/
XX.*
 FROM (SELECT Z.REF_NO,
              X.BIZ_GB,
              Z.BAL_AMT AS TRX_BAL,
              X.ACR_TOT,
              Z.BAL_AMT - X.ACR_TOT AS DIFF
         FROM (SELECT REF_NO, SUM(BAL_AMT) AS BAL_AMT
                 FROM AACT_TRX_BAL A
                WHERE A.REF_NO IN (SELECT REF_NO
                                     FROM AACT_ACR_BASE XX
                                    WHERE XX.ACR_KD = '3'
                                      AND XX.ACR_GB <> 'N'
                                      AND XX.SEQ_NO = 0
                                      AND STS = '0'
                                      )
                  AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                 AND A.ATIT_CD IN ('19101001','19101002','19101004') --COA LOAN 19101001, COA FB 19101002 19101004
                  AND DTLS_BAL_DV_CD = 'F309'
                                   --AND A.REF_NO = 'DFB0888221000002'
                                    GROUP BY REF_NO) Z,
              (SELECT /*+ index(B AACT_ACR_BAL_PK) */B.REF_NO, SUM(B.ACR_TOT) AS ACR_TOT, C.BIZ_GB
                 FROM AACT_ACR_BAL B, AACT_ACR_BASE C
                WHERE B.REF_NO = C.REF_NO
                  AND B.REF_NO IN (SELECT REF_NO
                                     FROM AACT_ACR_BASE XX
                                    WHERE XX.ACR_KD = '3'
                                      AND XX.ACR_GB <> 'N'
                                      AND XX.SEQ_NO = 0
                                      AND STS = '0')
                  AND C.BIZ_SEQ = B.BIZ_SEQ
                  AND C.BIZ_SUBSEQ = B.BIZ_SUBSEQ
                  AND C.AC_CD = B.AC_CD
                  AND C.SEQ_NO = 0
                  AND C.STS = '0'
                  AND C.ACR_KD = '3'
                  AND C.ACR_GB <> 'N'
                  AND C.REMARK NOT LIKE '%MIG%'
                GROUP BY B.REF_NO, C.BIZ_GB) X
        WHERE Z.REF_NO = X.REF_NO) XX
WHERE XX.DIFF <> 0`




module.exports = {bfCount, checkCloseBranch, expenseVBudget, allocationCollateral, checkBatchJob, checkNplAcrualHaveNormalAccrualBalance }