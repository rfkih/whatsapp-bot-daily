var bfCount = `select count(1) as count from aact_trx_actlog_bf where trx_il = trunc(sysdate)`;

var checkCloseBranch = `select b.enm, a.br_no, to_char(a.open_il, 'YYYY/MM/DD') as open_il , a.bon_clsgb, a.CLS_BIT
                        from aact_acc_clsbr a, acom_bix_base b
                        where a.br_no = b.br_no
                        and tr_il = trunc(sysdate)
                        order by a.cls_bit desc`;

var closeAccountHavebalance = {
  name: "CLOSE ACCOUNT HAVE BALANCE IN TRX_BAL",
  query: `SELECT A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM, SUM(B.BAL_AMT)
FROM ACOM_CONT_BASE A, AACT_TRX_BAL B, ACOM_COM_ACTCD C
WHERE A.REF_NO = B.REF_NO
 AND A.STS = '9'
 AND C.BR_NO = '0000'
 AND C.BSPL_GB = 'B'
 AND B.ATIT_CD = C.AC_CD
 AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT
 AND B.BAL_AMT <> 0
 AND (ATIT_CD NOT LIKE '815%' AND ATIT_CD NOT LIKE '915%') -- COA WO
--AND B.ATIT_CD IN ('15422014', '15421014') COA AMORT RESTRU
GROUP BY A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM
ORDER BY REF_NO`,
};

var giroPrkCancelCheck = {
    name : "Giro PRK Cancel Check",
    query : `      SELECT A.*                                                                                                      
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'C'                                                                    
           ELSE 'D'                                                                                         
            END ADJ_L_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > 0 THEN 'D'                                                                    
           ELSE 'C'                                                                                         
            END ADJ_D_DRCR                                                                                  
    , CASE WHEN A.L_BAL_AMT > D_BAL_AMT THEN D_BAL_AMT                                                      
           ELSE L_BAL_AMT                                                                                   
            END ADJUST_AMT                                                                                  
    , '0' AS IBF_GB                                                                                         
 FROM (SELECT REF_NO                                                                                        
            ,CCY                                                                                            
            ,BR_NO                                                                                          
            ,MAX(L_DTLS_BAL_DV_CD) L_DTLS_BAL_DV_CD                                                         
            ,MAX(D_DTLS_BAL_DV_CD) D_DTLS_BAL_DV_CD                                                         
            ,MAX(L_ATIT_CD) L_ATIT_CD                                                                       
            ,MAX(D_ATIT_CD) D_ATIT_CD                                                                       
            ,SUM(L_BAL_AMT) L_BAL_AMT                                                                       
            ,SUM(D_BAL_AMT) D_BAL_AMT                                                                       
         FROM (SELECT REF_NO                                                                                
                    , CCY                                                                                   
                    , BR_NO                                                                                 
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END L_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN DTLS_BAL_DV_CD                        
                           ELSE ''                                                                          
                            END D_DTLS_BAL_DV_CD                                                            
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END L_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN ATIT_CD                               
                           ELSE ''                                                                          
                            END D_ATIT_CD                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'L' THEN BAL_AMT                               
                           ELSE 0                                                                           
                            END L_BAL_AMT                                                                   
                    , CASE WHEN SUBSTR(DTLS_BAL_DV_CD,1,1) = 'D' THEN BAL_AMT                               
                            ELSE 0                                                                          
                             END D_BAL_AMT                                                                  
                 FROM AACT_TRX_BAL                                                                          
                WHERE REF_NO IN (SELECT REF_NO                                                              
                                   FROM AACT_TRX_BAL                                                        
                                  WHERE REF_NO IN (SELECT REF_NO                                            
                                                     FROM AACT_TRX_BAL                                      
                                                    WHERE TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT       
                                                      AND ATIT_CD = '21831001'                                 
                                                      AND BAL_AMT > 0                                          
                                                  )                                                            
                                    AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT         
                                    AND ATIT_CD = '15422011'                                                   
                                    AND (BAL_AMT > 0 OR BAL_AMT < 0)                                           
                                )                                                                              
                  AND TRUNC(SYSDATE) BETWEEN APCL_STR_DT AND APCL_END_DT                           
                  AND ATIT_CD IN ('15422011', '21831001')                                                      
             )                                                                                                 
        GROUP BY REF_NO,CCY,BR_NO                                                                              
    ) A                                                                                                        
ORDER BY REF_NO`,
}

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

var allocationCollateral = {
  name: "Allocation Collateral",
  query: `
SELECT  *
FROM    ACOM_BAT_PROCLST
WHERE   PROC_BRNO = '0888'
AND     PROC_DT   = TRUNC(SYSDATE)-1
AND     JOB_ID    LIKE 'dmb%'
AND     SEQ_NO    = 0
AND     PROC_STS  <> 2
`,
};

var checkBatchJob = {
  name: "Check Batch Job",
  query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
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
ORDER BY C.PROC_DT, C.STR_TM`,
};

module.exports = {
  bfCount,
  checkCloseBranch,
  expenseVBudget,
  allocationCollateral,
  checkBatchJob,
  closeAccountHavebalance,
  giroPrkCancelCheck
};
