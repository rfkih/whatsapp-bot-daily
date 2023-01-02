// var changeDate = "";

const date = (changeDate, type ) => {
var bfCount = `select count(1) as count from aact_trx_actlog_bf where trx_il = trunc(sysdate) ${changeDate}`;

var checkCloseBranch = `select b.enm, a.br_no, to_char(a.open_il, 'YYYY/MM/DD') as open_il , a.bon_clsgb, a.CLS_BIT
                        from aact_acc_clsbr a, acom_bix_base b
                        where a.br_no = b.br_no
                        and tr_il = trunc(sysdate) ${changeDate} 
                        order by a.cls_bit desc`;

                        var afterCloseBranch = {
                            name: "AFTER CLOSE - EXPENSE VS BUDGET",
                            query: `SELECT * FROM (
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
                                   AND DIFF <> 0`,
                          };
                          
                          var closeAccountHavebalance = {
                            name: "CLOSE ACCOUNT HAVE BALANCE IN TRX_BAL",
                            query: `SELECT A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM, SUM(B.BAL_AMT)
                          FROM ACOM_CONT_BASE A, AACT_TRX_BAL B, ACOM_COM_ACTCD C
                          WHERE A.REF_NO = B.REF_NO
                           AND A.STS = '9'
                           AND C.BR_NO = '0000'
                           AND C.BSPL_GB = 'B'
                           AND B.ATIT_CD = C.AC_CD
                           AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
                           AND B.BAL_AMT <> 0
                           AND (ATIT_CD NOT LIKE '815%' AND ATIT_CD NOT LIKE '915%') -- COA WO
                          --AND B.ATIT_CD IN ('15422014', '15421014') COA AMORT RESTRU
                          GROUP BY A.REF_NO, A.MGNT_BR_NO, A.SUBJ_CD, B.ATIT_CD, C.ENM
                          ORDER BY REF_NO`,
                          };
                          
                          var giroPrkCancelCheck = {
                            name: "Giro PRK Cancel Check",
                            query: `      SELECT A.*                                                                                                      
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
                                                                              WHERE trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT       
                                                                                AND ATIT_CD = '21831001'                                 
                                                                                AND BAL_AMT > 0                                          
                                                                            )                                                            
                                                              AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT         
                                                              AND ATIT_CD = '15422011'                                                   
                                                              AND (BAL_AMT > 0 OR BAL_AMT < 0)                                           
                                                          )                                                                              
                                            AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT                           
                                            AND ATIT_CD IN ('15422011', '21831001')                                                      
                                       )                                                                                                 
                                  GROUP BY REF_NO,CCY,BR_NO                                                                              
                              ) A                                                                                                        
                          ORDER BY REF_NO`,
                          };
                          
                          var GlBalanceCheck = {
                            name: "GL Balance Check",
                            query: `SELECT *
                              FROM (SELECT 'BS' AS GBBBBBBBBBB,
                                              TR_IL,
                                           --TO_CHAR(TR_IL, 'YYYY/MM/DD'),
                                           BR_NO,
                                           SUM(DR) AS DR,
                                           SUM(CR) AS CR,
                                           SUM(DR) - SUM(CR) AS DIFFFFFFFFFF
                                      FROM (SELECT TR_IL ,
                                                   BR_NO,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) = '1' THEN
                                                      AF_FJAN
                                                     ELSE
                                                      0
                                                   END AS DR,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3') THEN
                                                      AF_FJAN
                                                     ELSE
                                                      0
                                                   END AS CR
                                              FROM AACT_ACT_DATE
                                             WHERE TR_IL = trunc(sysdate) ${changeDate}
                                               AND SUBSTR(AC_CD, 1, 1) IN ('1', '2', '3'))
                                     GROUP BY TR_IL, BR_NO
                                    UNION ALL
                                    SELECT 'PL' AS GB,
                                           TR_IL,
                                           BR_NO,
                                           SUM(DR),
                                           SUM(CR),
                                           (SUM(DR) - SUM(CR)) + SUM(DIFF)
                                      FROM (SELECT TR_IL,
                                                   BR_NO,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) IN ('5') THEN
                                                      AF_FJAN --?? / DR
                                                     ELSE
                                                      0
                                                   END AS DR,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) IN ('4') THEN
                                                      AF_FJAN --?? / ?? / CR
                                                     ELSE
                                                      0
                                                   END AS CR,
                                                   CASE
                                                     WHEN AC_CD = '33101001' THEN
                                                      AF_FJAN
                                                     ELSE
                                                      0
                                                   END AS DIFF
                                              FROM AACT_ACT_DATE
                                             WHERE TR_IL = trunc(sysdate) ${changeDate})
                                     GROUP BY TR_IL, BR_NO
                                    UNION ALL
                                    SELECT 'BS/PL' AS GB,
                                           TR_IL,
                                           BR_NO,
                                           SUM(DR),
                                           SUM(CR),
                                           SUM(DR) - SUM(CR)
                                      FROM (SELECT TR_IL,
                                                   BR_NO,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) IN ('1', '5') THEN
                                                      AF_FJAN --?? / DR
                                                     ELSE
                                                      0
                                                   END AS DR,
                                                   CASE
                                                     WHEN SUBSTR(AC_CD, 1, 1) IN ('2', '3', '4') THEN
                                                      AF_FJAN --?? / ?? / CR
                                                     ELSE
                                                      0
                                                   END AS CR
                                              FROM AACT_ACT_DATE
                                             WHERE TR_IL = trunc(sysdate) ${changeDate}
                                               AND AC_CD != '33101001')
                                     GROUP BY TR_IL, BR_NO)
                            --ORDER BY GB, TR_IL, BR_NO 
                            UNION ALL
                            --RCH_BAL 
                            SELECT 'AFEX_RCH_BAL',
                                   T1.TR_IL,
                                   T1.CD,
                                   T1.SHW_OPBS - NVL(T2.AMT, 0),
                                   T1.SHW_CLBS,
                                   (T1.SHW_OPBS - NVL(T2.AMT, 0)) - T1.SHW_CLBS AS DIFF
                              FROM AFEX_RCH_BAL T1
                              LEFT OUTER JOIN (SELECT CD,
                                                      SUM(CASE
                                                            WHEN DRCR_GB = 'D' THEN
                                                             DRCR_AMT * -1
                                                            WHEN DRCR_GB = 'C' THEN
                                                             DRCR_AMT
                                                          END) AS AMT
                                                 FROM AFEX_RCH_PEND
                                                WHERE TR_IL = trunc(sysdate) ${changeDate}
                                                  AND SA_GB = 'S'
                                                GROUP BY CD) T2
                                ON T1.CD = T2.CD
                             WHERE T1.TR_IL = trunc(sysdate) ${changeDate}
                            --   AND T1.CD < 2011
                            UNION ALL
                            --28911001
                            --WASH
                            SELECT 'WASH',
                                   A.TR_IL,
                                   A.BR_NO,
                                   NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, 0)), 0) AS drFamt,
                                   NVL(SUM(DECODE(B.BLDRCR_GB, 'C', A.AF_FJAN, 0)), 0) AS crFamt,
                                   NVL(SUM(DECODE(B.BLDRCR_GB, 'D', A.AF_FJAN, -A.AF_FJAN)), 0) AS fdiff
                              FROM AACT_ACT_DATE A, ACOM_COM_ACTCD B
                             WHERE A.BSPL_GB = 'B'
                               AND A.TR_IL = trunc(sysdate) ${changeDate}
                               AND A.BSPL_GB = B.BSPL_GB
                               AND A.AC_CD = B.AC_CD
                               AND A.AC_CD = '28911001'
                               AND B.BR_NO = '0000'
                               AND B.AC_KD NOT IN ('6', '7', '8', '9')
                             GROUP BY A.BR_NO, A.TR_IL
                            UNION ALL
                            --ATMCASH
                            SELECT 'ATMCASH', A.*, A.ATM_DT_BAL - A.ACT_DT_BAL AS DIFF
                              FROM (SELECT A.TR_DT,
                                           A.BR_NO,
                                           SUM(A.AF_BAL) AS ATM_DT_BAL,
                                           B.AF_FJAN AS ACT_DT_BAL
                                      FROM AACT_ATM_DATE A
                                     INNER JOIN AACT_ACT_DATE B
                                        ON A.AC_CD = B.AC_CD
                                       AND A.BR_NO = B.BR_NO
                                       AND A.TR_DT = B.TR_IL
                                     WHERE 1 = 1
                                     GROUP BY A.TR_DT, A.BR_NO, B.AF_FJAN) A
                             WHERE A.TR_DT = trunc(sysdate) ${changeDate}
                             `,
                          };
                          
                          var GlBalanceVsTrxBal = {
                            name: "GL Balance VS TRX Bal",
                            query: `SELECT B.*, A.*
                              FROM ACOM_COM_ACTCD A, --TABEL COA
                                   (SELECT BR_NO,
                                           COA_CD,
                                           CCY,
                                           SUM(TRX_AMT) AS TRX_AMT,
                                           SUM(ACT_AMT) AS ACT_AMT,
                                           SUM(TRX_AMT) - SUM(ACT_AMT) AS DIFF_AMT
                                      FROM (SELECT BR_NO,
                                                   ATIT_CD AS COA_CD,
                                                   CCY,
                                                   SUM(BAL_AMT) AS TRX_AMT,
                                                   0 AS ACT_AMT
                                              FROM AACT_TRX_BAL --TABEL TRANSAKSI BALANCE
                                             WHERE BAL_AMT != 0
                                                  --AND     ATIT_CD   = '18304101'
                                                  --AND     BR_NO     = '1201'
                                               AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
                                             GROUP BY BR_NO, ATIT_CD, CCY
                                            UNION ALL
                                            SELECT BR_NO, AC_CD, CCY, 0, SUM(AF_FJAN) AS ACT_AMT
                                              FROM AACT_ACT_DATE --TABEL GENERAL LEDGER
                                             WHERE TR_IL = trunc(sysdate) ${changeDate}
                                                  --AND     AC_CD = '18304101'
                                               AND AF_BJAN != 0
                                             GROUP BY BR_NO, AC_CD, CCY)
                                     GROUP BY BR_NO, COA_CD, CCY
                                    HAVING SUM(TRX_AMT) - SUM(ACT_AMT) != 0) B
                             WHERE A.BR_NO = '0000'
                               AND A.AC_CD = B.COA_CD
                               AND A.AC_KD IN ('1', '2', '3', '6', '7', '8', '9')
                               AND A.AC_CD NOT IN ('10101001' -- Cash in Vault
                                                  ,'10102001' -- Petty Cash
                                                  ,'10104001' -- ATM Cash
                                                  ,'10401001' -- Demand Deposit at Bank Indonesia
                                                  ,'10421001' -- Demand Deposit at Domestic Banks
                                                  ,'18302101' -- Suspence Receivable ATM
                                                  ,'18809001' -- Inter Office Account
                                                  ,'28809001' -- Inter Office A/C (Settlement)
                                                  ,'19959002' -- ARTAJASA Receivable
                                                  ,'19959003' -- ALTO Receivable
                                                  ,'28936001' -- Liability to Indosat Due to Overbooking Transaction
                                                  ,'28937001' -- Liability to XL Due to Overbooking Transaction
                                                  ,'28938001' -- Liability to Smartfen Due to Overbooking Transaction
                                                  ,'28941001' -- Liability to ARTAJASA 
                                                  ,'28942001' -- Liability to ATM Fee
                                                  ,'28943001' -- Liability to  Join Debit Due to Overbooking Transaction
                                                  ,'33001001' -- Previous Years Accumulated Profit/Loss
                                                  ,'33101001' -- Current Year Profit/Loss
                                                  ,'28090001'
                                                                        ,'28911001'
                                                                        ,'80000002'
                                                                        ,'90000002'
                                                                        ,'28944001'
                                                                        ,'28940001'
                                                                        ,'20040002')
                             ORDER BY B.COA_CD, B.BR_NO, B.CCY`,
                          };
                          
                          var liabiltyMinusCheck = {
                            name: "Liability Minus Check",
                            query: `SELECT A.TR_IL, A.BR_NO, B.ENM AS COA_NM, A.AC_CD AS COA, A.AF_FJAN, A.CCY, '' AS REF_NO
                              FROM AACT_ACT_DATE A, ACOM_COM_ACTCD B --TABEL GL DAN COA 
                             WHERE A.AC_CD = B.AC_CD
                               AND A.TR_IL = trunc(sysdate) ${changeDate}
                               AND A.AC_CD LIKE '2%' --COA LIAB
                               AND A.AC_CD <> '28991501' --COA CKPN NOT INCLUDE
                               AND A.AF_FJAN < 0
                            UNION ALL
                            SELECT C.APCL_STR_DT, C.BR_NO, D.ENM AS COA_NM, C.ATIT_CD AS COA, C.BAL_AMT, C.CCY, C.REF_NO
                              FROM AACT_TRX_BAL C, ACOM_COM_ACTCD D --TABEL TRANSAKSI BALANCE DAN COA 
                             WHERE C.ATIT_CD = D.AC_CD
                               AND C.ATIT_CD LIKE '2%'
                               AND C.ATIT_CD <> '28991501' --COA CKPN NOT INCLUDE
                               AND TRUNC(SYSDATE)${changeDate? "-2" : "-1"} BETWEEN APCL_STR_DT AND APCL_END_DT
                               AND C.BAL_AMT < 0
                               AND C.REF_NO NOT LIKE 'DJN%'
                               --and C.APCL_STR_DT > TO_DATE('18072019', 'DDMMYYYY')`,
                          };
                          
                          var loanBaseNSwithLoanSch = {
                            name: "Loan Base not Same With Loan Schedule",
                            query: `SELECT *
                              FROM (SELECT T1.*,
                                           T2.PLAN_AMT AS SCH_PLAN_AMT,
                                           T1.LON_JAN - (T2.PLAN_AMT - T2.PAY_AMT) AS DIFF --TOTAL PINJAMAN - TOTAL PINJAMAN DI SCHEDULE
                                      FROM (SELECT A.REF_NO, A.LON_JAN
                                              FROM ADST_LNB_BASE A, ACOM_CONT_BASE B --TABEL LOAN BASE AND ACCOUNT FASILTAS
                                             WHERE A.REF_NO = B.REF_NO
                                               AND B.STS = '0') T1,
                                           (SELECT A.REF_NO,
                                                   SUM(PLAN_AMT) AS PLAN_AMT,
                                                   SUM(PAY_AMT) AS PAY_AMT
                                              FROM ADST_LNB_SCH A -- TABEL LOAN SCHEDULE
                                             WHERE A.REF_NO IN (SELECT B.REF_NO
                                                                  FROM ACOM_CONT_BASE B
                                                                 WHERE B.STS = '0')
                                               AND A.SCH_GB = '001'
                                               AND STS = '0'
                                               AND A.ADJ_SEQ = 0
                                             GROUP BY REF_NO) T2
                                     WHERE T1.REF_NO = T2.REF_NO
                                       AND T1.LON_JAN <> T2.PLAN_AMT) TT1
                             WHERE (TT1.DIFF > 1 OR TT1.DIFF < -1)`,
                          };
                          
                          var loanBatchPaymentProcess = {
                            name: "Loan Batch Payment Process",
                            query: `SELECT  *
                              FROM    ACOM_ATB_BATCH
                              WHERE   VAL_DT    = trunc(sysdate) ${changeDate}
                              AND     TR_TYPE   LIKE 'LN%'
                              AND     ERR_MSG   IS NULL`,
                          };
                          
                          var allocationCollateral = {
                            name: "Allocation Collateral",
                            query: `
                          SELECT  *
                          FROM    ACOM_BAT_PROCLST
                          WHERE   PROC_BRNO = '0888'
                          AND     PROC_DT   = trunc(sysdate)${changeDate? "-2" : "-1"}
                          AND     JOB_ID    LIKE 'dmb%'
                          AND     SEQ_NO    = 0
                          AND     PROC_STS  <> 2
                          `,
                          };
                          
                          var otBatchCheck = {
                            name: "OT Batch Check",
                            query: `SELECT a.proc_dt,
                              a.bat_pgm_id,
                              a.proc_brno,
                              proc_sts,
                              str_tm,
                              end_tm,
                              (substr(end_tm, 0, 2) * 60 + substr(end_tm, 4, 2) +
                              substr(end_tm, 7, 2) / 60) -
                              (substr(str_tm, 0, 2) * 60 + substr(str_tm, 4, 2) +
                              substr(str_tm, 7, 2) / 60) as execution_time
                          FROM ACOM_BAT_PROCLST A
                          WHERE A.PROC_DT = trunc(sysdate) ${changeDate}
                          AND A.BAT_PGM_ID LIKE 'OT%'
                          AND PROC_STS <> 2
                          order by str_tm`,
                          };
                          
                          var wrongAmort = {
                            name: "Wrong Amortization",
                            query: `select *
                              from IFRS_DD_BY_CFLW_DPRC_PTCL a
                             where (BASC_DT, IFRS_ACCT_MGNT_NO, DPRC_DT) in
                                   (select BASC_DT, IFRS_ACCT_MGNT_NO, max(DPRC_DT) DPRC_DT
                                      from IFRS_DD_BY_CFLW_DPRC_PTCL z
                                     WHERE z.ifrs_acct_mgnt_no not like 'DAG%'
                                       and z.comm_cd not like '9999%'
                                     group by BASC_DT, IFRS_ACCT_MGNT_NO
                                    )
                               and DPRC_TGT_AMT < 0
                               and a.comm_cd not like '99999%'
                             order by BASC_DT desc, IFRS_ACCT_MGNT_NO`,
                          };
                          
                          var checkBatchJobMonday = {
                            name: "Check Batch Job For Every Monday",
                            query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
                          CASE 
                          WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
                          WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
                          CASE 
                          WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
                          (
                          SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= trunc(sysdate) ${changeDate} AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
                          ) C
                          WHERE PROC_STS = '9' --STATUS ERROR
                          AND NOT 
                          (RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
                          OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
                          OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
                          OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
                          ORDER BY C.PROC_DT, C.STR_TM`,
                          };
                          
                          var checkBatchJobTuesdayFriday = {
                            name: "Check Batch Job For Tueday ~ Friday ",
                            query: `SELECT PROC_DT, BAT_PGM_ID, SEQ_NO, STR_DT, STR_TM, END_DT, END_TM, REG_EMP_NO, 
                              CASE 
                              WHEN PROC_STS = '1' THEN 'ON PROCESSING' 
                              WHEN PROC_STS = '2' THEN 'SUCCESS' ELSE 'FAILED' END AS STATUS, 
                              CASE 
                              WHEN RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%' THEN 'RUNNING ON EOM' ELSE RTN_MSG END AS RTN_MSG FROM 
                              (
                              SELECT * FROM ACOM_BAT_PROCLST A WHERE A.PROC_DT >= trunc(sysdate) ${changeDate} AND A.STR_TM > '07:00:00' AND BAT_PGM_ID <> 'RTGS_ACTUAL_REGIST' --TABEL AUTO BATCH
                              ) C
                              WHERE PROC_STS = '9' --STATUS ERROR
                              AND NOT 
                              (RTN_MSG LIKE '(atb6000:9005)(atb6000:9009)(CMG_TPM:1002)%'  -- RUNNING ON EOM
                              OR RTN_MSG LIKE '(CMB_INIT_PASS)%'                           -- WRONG PASS
                              OR RTN_MSG LIKE '(2010:0)%'                                  -- TODAY IS HOLIDAY
                              OR RTN_MSG LIKE '(cmb_dt_reconcile:%')                       -- PRINTER IS NOT OPEN
                              ORDER BY C.PROC_DT, C.STR_TM`,
                          };
                          
                          var checkBatchJobFirstDay = {
                            name: "Check Batch Job For 1st Day of the Month ",
                            query: `select mng_br as branch_no,
                              count(mng_br) as exec_contract,
                              case
                                when count(mng_br) > 0 then
                                 'SUCCESS'
                                else
                                 'PLEASE CHECK'
                              end as REMARK
                          from acom_atb_batch
                          where val_dt = LAST_DAY(ADD_MONTHS(trunc(sysdate) ${changeDate}, -1)) + 1
                          and tr_type like 'DP32%'
                          group by mng_br
                          order by mng_br asc`,
                          };
                          
                          var accrualHaveNormalAccrualBal = {
                            name: "NPL ACCRUAL HAVE NORMAL ACCRUAL BALANCE",
                            query: `SELECT /*+PARALLEL(XX 16)+*/
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
                                                AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
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
                              WHERE XX.DIFF <> 0`,
                          };
                          
                          var accrualHaveNplAcrrualBal = {
                            name: "NORMAL ACCRUAL HAVE NPL ACCRUAL BALANCE",
                            query: `SELECT /*+PARALLEL(XX 16)*/
                              XX.*
                               FROM (SELECT Z.REF_NO,
                                            X.BIZ_GB,
                                            Z.BAL_AMT AS TRX_BAL,
                                            X.ACR_TOT,
                                            Z.BAL_AMT - X.ACR_TOT AS DIFF
                                       FROM (SELECT REF_NO, BAL_AMT
                                               FROM AACT_TRX_BAL A
                                              WHERE A.REF_NO IN (SELECT REF_NO
                                                                   FROM AACT_ACR_BASE XX
                                                                  WHERE XX.ACR_KD = '3'
                                                                    AND XX.ACR_GB = 'N'
                                                                    AND XX.SEQ_NO = 0
                                                                    AND STS = '0')
                                                AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                                                AND A.ATIT_CD = '81003001'
                                                AND DTLS_BAL_DV_CD = 'F841') Z,
                                            (SELECT B.REF_NO, SUM(B.ACR_TOT) AS ACR_TOT, C.BIZ_GB
                                               FROM AACT_ACR_BAL B, AACT_ACR_BASE C
                                              WHERE B.REF_NO = C.REF_NO
                                                AND B.REF_NO IN (SELECT REF_NO
                                                                   FROM AACT_ACR_BASE XX
                                                                  WHERE XX.ACR_KD = '3'
                                                                    AND XX.ACR_GB = 'N'
                                                                    AND XX.SEQ_NO = 0
                                                                    AND STS = '0')
                                                AND C.BIZ_SEQ = B.BIZ_SEQ
                                                AND C.BIZ_SUBSEQ = B.BIZ_SUBSEQ
                                                AND C.AC_CD = B.AC_CD
                                                AND C.SEQ_NO = 0
                                                AND C.STS = '0'
                                                AND C.ACR_KD = '3'
                                                AND C.ACR_GB = 'N'
                                                AND C.REMARK NOT LIKE '%MIG%'
                                              GROUP BY B.REF_NO, C.BIZ_GB) X
                                      WHERE Z.REF_NO = X.REF_NO) XX
                              WHERE XX.DIFF <> 0`,
                          };
                          
                          var nplAcrualAndNormalAccrualBal = {
                            name: "NPL ACCRUAL & NORMAL ACCRUAL BALANCE",
                            query: `SELECT * /*+PARALLEL(T1 8) (T2 8)*/
                              FROM (SELECT REF_NO AS REF_NO_OFF, BAL_AMT AS BAL_AMT_OFF
                                      FROM AACT_TRX_BAL A
                                     WHERE A.REF_NO IN (SELECT REF_NO
                                                          FROM AACT_ACR_BASE XX
                                                         WHERE XX.ACR_KD = '3'
                                                              --AND XX.ACR_GB = 'N'
                                                           AND XX.SEQ_NO = 0
                                                        --AND STS = '0'
                                                        )
                                       AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                                       AND A.ATIT_CD = '81003001'
                                       AND DTLS_BAL_DV_CD = 'F841'
                                       AND BAL_AMT <> 0) T1,
                                   (SELECT REF_NO AS REF_NO_ON, BAL_AMT AS BAL_AMT_ON
                                      FROM AACT_TRX_BAL A
                                     WHERE A.REF_NO IN (SELECT REF_NO
                                                          FROM AACT_ACR_BASE XX
                                                         WHERE XX.ACR_KD = '3'
                                                              --AND XX.ACR_GB = 'N'
                                                           AND XX.SEQ_NO = 0
                                                        --AND STS = '0'
                                                        )
                                       AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND A.APCL_END_DT 
                                       AND A.ATIT_CD = '19101001'
                                       AND DTLS_BAL_DV_CD = 'F309'
                                       AND BAL_AMT <> 0) T2
                             WHERE T1.REF_NO_OFF = T2.REF_NO_ON`,
                          };
                          
                          var nplHaveNormalAccrualOrNonNplHaveNplAccrual = {
                            name: "NPL HAVE NORMAL ACCRUAL OR NON-NPL HAVE NPL ACCRUAL",
                            query: `SELECT /*+ PARALLEL(A 8)(B 8) (C 8)*/
                              A.REF_NO, C.BAL_AMT, A.DBT_APTC_YN, 'NPL HAVE NORMAL ACCRUAL'
                               FROM ACOM_CONT_BASE A,
                                    (SELECT REF_NO,
                                            DECODE(ACRSD_AC, '91003001', '19101001', ACRSD_AC) AS ACRSD_AC
                                       FROM AACT_ACR_BASE A
                                      WHERE SEQ_NO = '0'
                                        AND STS = '0'
                                        AND A.ACR_KD = '3') B,
                                    AACT_TRX_BAL C
                              WHERE A.REF_NO = B.REF_NO
                                AND A.REF_NO = C.REF_NO
                                AND A.DBT_APTC_YN IN ('3', '4', '5')
                                AND B.ACRSD_AC = C.ATIT_CD
                                AND C.CCY = 'IDR'
                                AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
                                AND C.BAL_AMT <> 0
                             UNION ALL
                             SELECT /*+ PARALLEL(A 8)(B 8) (C 8)*/
                              A.REF_NO, C.BAL_AMT, A.DBT_APTC_YN, 'NON-NPL HAVE NPL ACCRUAL'
                               FROM ACOM_CONT_BASE A,
                                    (SELECT REF_NO
                                       FROM AACT_ACR_BASE A
                                      WHERE SEQ_NO = '0'
                                        AND STS = '0'
                                        AND A.ACR_KD = '3') B,
                                    AACT_TRX_BAL C
                              WHERE A.REF_NO = B.REF_NO
                                AND A.REF_NO = C.REF_NO
                                AND A.DBT_APTC_YN NOT IN ('3', '4', '5')
                                AND C.ATIT_CD IN
                                    (SELECT ETC1 FROM ACOM_COMH_CODE A WHERE TYPE = 'F1250')
                                AND C.CCY = 'IDR'
                                AND trunc(sysdate) ${changeDate} BETWEEN APCL_STR_DT AND APCL_END_DT
                                AND C.BAL_AMT <> 0`,
                          };
                          
                          var transactionBackdate = {
                            name: "TRANSACTION BACKDATED/ BACK VALUE IN LAST 7 DAYS",
                            query: `SELECT A.REF_NO, A.HIS_NO, A.TRX_BR, A.UPMU_CD || GEOR_CD AS MENU, TO_CHAR(A.TRX_IL, 'YYYY-MM-DD') AS TRX_IL , TO_CHAR(A.AC_IL, 'YYYY-MM-DD') AS AC_IL , TO_CHAR(A.IB_IL) AS IB_IL , TO_CHAR(A.GIS_IL) AS GIS_IL, A.CAN_IL /*+ PARALLEL(A, 16)*/
                            FROM AACT_TRX_BASE A
                           WHERE A.TRX_IL >= TRUNC(SYSDATE - 7)
                             AND (REF_NO NOT LIKE 'DBT%' AND REF_NO NOT LIKE 'ACR%')
                             AND (A.TRX_IL > A.AC_IL OR
                                 (A.AC_IL <> A.IB_IL OR A.AC_IL <> A.GIS_IL OR A.AC_IL < A.CAN_IL))`,
                          };

                          var checkDwi = ` select cd, remark from acom_reh_his where base_dt = trunc(sysdate) ${changeDate} and cd = 'CM603'`;

                          if (type === "check") {
                            return [bfCount, checkCloseBranch, checkDwi]
                          }else if (type === "daily" || type === "all") {
                            return [ afterCloseBranch,
                                  allocationCollateral,
                                  checkBatchJobMonday,
                                  checkBatchJobTuesdayFriday,
                                  checkBatchJobFirstDay,
                                  accrualHaveNormalAccrualBal,
                                  accrualHaveNplAcrrualBal,
                                  nplAcrualAndNormalAccrualBal,
                                  nplHaveNormalAccrualOrNonNplHaveNplAccrual,
                                  transactionBackdate,
                                  closeAccountHavebalance,
                                  giroPrkCancelCheck,
                                  GlBalanceCheck,
                                  GlBalanceVsTrxBal,
                                  liabiltyMinusCheck,
                                  loanBaseNSwithLoanSch,
                                  loanBatchPaymentProcess,
                                  otBatchCheck,
                                  wrongAmort
                                  ]
                          }
   
 
  
};







module.exports = {

  date,
};
