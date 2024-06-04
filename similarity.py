from sentence_transformers import SentenceTransformer, util
import csv
import sys
import re
import copy
import numpy as np
from numpy import dot
from numpy.linalg import norm
import pickle

def load_model():
    try:
        print("Loading model...")
        model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        print("Model loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

directory = ''
if (len(sys.argv) > 2):
    directory = sys.argv [2]

#from spellchecker import SpellChecker
#french = SpellChecker(language='fr')

debug = False

indexFournisseurs = 7

def replaceNumber (string):
    f = ''
    for c in string:
        #print ('c = ', c)
        if c.isdigit () or c == '.' or c == ',' or c == '-':
            if c == '.' or c == ',':
                f += '.'
            else:
                f += c
        else:
            return False
    #print ('f = ', f)
    return f

def replaceSpecial (query):
    query = query.lower ()
    query = query.replace ('"', ' ')
    query = query.replace ("'", " ")
    query = query.replace ("’", " ")
    query = query.replace ("?", " ")
    query = query.replace (":", " ")
    query = query.replace (";", " ")
    #query = query.replace (".", " ")
    #query = query.replace (",", " ")
    query = query.replace ("é", "e")
    query = query.replace ("è", "e")
    query = query.replace ("à", "a")
    query = query.replace ("û", "u")

    if len (query) > 0:
        while query [0] == ' ':
            query = query [1:]
        while query [-1] == ' ':
            query = query [:-1]

    #end = len (query) - 1
    #for i in range (len (query)):
    #    if query [i] == ' ':
    #        end = i - 1
    #        break

    #if end < len (query) and end > -1:
    #    if query [end] == 's':
    #        query = query [:end] + query [end +1:]
        
    return query

def load (csv):
    mat = []
    with open(csv, 'r', encoding="utf-8") as file:
        i = 0
        for row in file:
            result = []
            last = 0
            for j in range (len (row)):
                if row [j] == ';':
                    if last == j:
                        result.append ('')
                    else:
                        result.append (row [last:j])
                    last = j + 1
                if j == len (row) - 1:
                    result.append (row [last:j])
            if result == []:
                break
            mat.append (result)
    return mat

#questions = load ('similarity.csv')
#reponses = load ('reponses.csv')
questions = load (directory + 'questions.csv')

print (len (questions), 'questions.')
#print (len (reponses), 'réponses.')
try:
   with open(directory + 'MotsCles.csv', 'r', encoding="utf-8") as file:
    i = 0
    labels = []
    rows = []
    for row in file:
        #if i == 0:
        #    print (row)
        result = []
        last = 0
        for j in range (len (row)):
            #print (row [i])
            if row [j] == ';':
                #print (i)
                if last == j:
                    result.append ('')
                else:
                    s = replaceSpecial(row [last:j])
                    result.append (s)
                last = j + 1
            if j == len (row) - 1:
                s = replaceSpecial(row [last:j])
                result.append (s)
        if result == []:
            break
        if i == 0:
            for string in result:
                #s = re.sub(r'[\W_]', '', string)
                #s = s.replace(" ","")
                #s = s.lower ()
                #labels.append (s)
                labels.append (replaceSpecial(string))
        else:
            rows.append (result)
        i = i + 1
except Exception as e:
    print(f"Error loading MotsCles.csv: {e}")

print(f"Labels: {labels}")
if rows:
    print(f"First row: {rows[0]}")
#print (labels)
#print (rows [0])

synonymes = []
#with open('Synonymes.csv', 'r') as file:
with open(directory + 'Synonymes.csv', 'r', encoding="utf-8") as file:
    i = 0
    for row in file:
        result = []
        last = 0
        for j in range (len (row)):
            #print (row [i])
            if row [j] == ';':
                #print (i)
                if last == j:
                    result.append ('')
                else:
                    result.append (replaceSpecial(row [last:j]))
                last = j + 1
            if j == len (row) - 1:
                result.append (replaceSpecial(row [last:j]))
        if result == []:
            break
        if i == 0:
            for w in range(len(result)):
                if result [w] != '':
                    synonymes.append ([result [w]])
        else:
            for w in range(len(result)):
                if result [w] != '':
                    #print (i, w, synonymes [w], result [w])
                    if len (result [w]) > 0:
                        synonymes [w].append (result [w])
                        if result [w] [-1] == 's':
                            synonymes [w].append (result [w] [:-1])
        i = i + 1

#print (synonymes)

def getSynonymes (query):
    l = [query]
    for i in range (len (synonymes)):
        for j in range (len (synonymes [i])):
            if query [:len (synonymes [i] [j])].lower () == synonymes [i] [j].lower ():
                l = l + synonymes [i]
    return l

def levenshteinDistance (s1, s2):
    if len(s1) > len(s2):
        s1, s2 = s2, s1

    distances = range(len(s1) + 1)
    for i2, c2 in enumerate(s2):
        distances_ = [i2+1]
        for i1, c1 in enumerate(s1):
            if c1 == c2:
                distances_.append(distances[i1])
            else:
                distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
        distances = distances_
    return distances[-1]

def loadFEC (csv):
    global labelsFEC, rowsFEC, Fournisseurs, indexFournisseurs
    labelsFEC = []
    rowsFEC = []
    Fournisseurs = []
    #with open(csv, 'r') as file:
    with open(csv, 'r', encoding="utf-8") as file:
        i = 0
        for row in file:
            #if i == 0:
            #    print (row)
            result = []
            last = 0
            for j in range (len (row)):
                if row [j] == ';':
                    if last == j:
                        result.append ('')
                    else:
                        result.append (replaceSpecial(row [last:j]))
                    last = j + 1
                if j == len (row) - 1:
                    result.append (replaceSpecial(row [last:j]))
            if result == []:
                break
            if i == 0:
                for string in result:
                    #s = re.sub(r'[\W_]', '', string)
                    #s = s.replace(" ","")
                    #s = s.lower ()
                    #labels.append (s)
                    labelsFEC.append (replaceSpecial(string))
                    if string.find ('CompAuxLib') != -1:
                        indexFournisseurs = len (labelsFEC) - 1
            else:
                rowsFEC.append (result)
                if result [indexFournisseurs] != '':
                    f = result [indexFournisseurs]
                    if not f in Fournisseurs:
                        Fournisseurs.append (f)
            i = i + 1
    for i in range (len (Fournisseurs)):
        sys.stdout.write (Fournisseurs [i])
        if i < len (Fournisseurs) - 1:
            sys.stdout.write (';')
        else:
            sys.stdout.write ('\n')

if (len(sys.argv) > 1):
    loadFEC (directory + sys.argv [1])
else:
    loadFEC (directory + 'FEC-Restau.csv')

debug = False

mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

def memeMot (w, f):
    if len (w) < len (f):
        return False
    if len (w) == len (f):
        return w == f
    if w [:len (f)] == f:
        if not w [len (f)] in 'abcdefghijklmnopqrstuvwxyz':
            return True
    return False

def MotsCles (query):
    xxx = []
    mmm = []
    fff = []
    q = replaceSpecial (query)
    for i in range (len (q)):
        startWord = False
        if i == 0:
            startWord = True
        elif q [i - 1] == ' ':
            startWord = True
        if startWord:
            bestLength = 0
            w = q [i:]
            listeSynonymes = getSynonymes (w)
            if debug:
                print ('listeSynonymes', listeSynonymes)
            for m in mois:
                mm = replaceSpecial (m)
                if len (w) >= len (mm):
                    if w [:len (mm)] == mm:
                        mmm.append (mm)
                        if debug:
                            print (mm)
            for f in Fournisseurs:
                ff = replaceSpecial (f)
                if len (w) >= len (ff):
                    #if w [:len (ff)] == ff: # tr fournisseur si mote cle tresorerie
                    if memeMot (w, ff):
                        fff.append (ff)
                        if debug:
                            print (ff)
            for lab in range (len (labels)):
                for row in range (len (rows)):
                    if len (rows [row] [lab]) > 0:
                        #for w in listeSynonymes: # remplace investissements par immobilisations => pb embedding
                        for w1 in listeSynonymes: # remplace investissements par immobilisations => pb embedding
                            if len (w1) >= len (rows [row] [lab]):
                                # tester avec distance d'edition <= 2 pour fautes de frappes et chiffre d'affaire
                                #if w [:len (rows [row] [lab])].lower () == rows [row] [lab].lower ():
                                if len (rows [row] [lab]) > 2: 
                                    if levenshteinDistance (w1 [:len (rows [row] [lab])], rows [row] [lab]) < 2: 
                                        if debug:
                                            print ('Mot cle possible', rows [row] [lab], ', mot =', w)
                                        if len (rows [row] [lab]) > bestLength:
                                            bestLength = len (rows [row] [lab])
                                            #mot = rows [row] [lab] probleme remplace investissements par immobilisations dans la question
                                                                    # ce qui perturbe l'embedding
                                            mot = w
            if bestLength > 0:
                xxx.append (mot)
                if debug:
                    print (mot)
    return xxx,mmm,fff

def replaceMotsCles (q, xxx, mmm, fff, vvv):
    for j in range (len (xxx)):
        m = 'xxx' + str (j + 1)
        #m = 'xxx'
        q = q.replace (m, xxx [j])
    for j in range (len (mmm)):
        m = 'mmm' + str (j + 1)
        #m = 'mmm'
        q = q.replace (m, mmm [j])
    for j in range (len (fff)):
        m = 'fff' + str (j + 1)
        #m = 'fff'
        q = q.replace (m, fff [j])
    for j in range (len (vvv)):
        m = 'vvv' + str (j + 1)
        q = q.replace (m, vvv [j])
    return q

def indexEmbedding (query, xxx, mmm, fff):
    best = -1.0
    besti = -1
    bestq = ''
    q = replaceSpecial (query)
    embedding2 = model.encode (q)
    for i in range (3, len (questions)):
        q = replaceSpecial (questions [i] [0])
        # 'par mois' et 'par' est un fournisseur : oter les fournisseurs qui sont des mots de la question ? 
        if len (q) > 3:
            q = replaceMotsCles (q, xxx, mmm, fff, [])
            if q.find ('xxx') != -1:
                continue
            if q.find ('yyy') != -1:
                continue
            if q.find ('fff') != -1:
                continue
            if q.find ('mmm') != -1:
                continue
            embedding1 = model.encode (q)
            sim = dot (embedding1, embedding2) / (norm(embedding1) * norm(embedding2))
            if debug:
                print (q, sim)
            if sim > best:
                best = sim
                besti = i
                bestq = q
    return besti,best,bestq

def similarity (q1, q2):
    embedding1 = model.encode(q1)
    embedding2 = model.encode(q2)
    sim = dot (embedding1, embedding2) / (norm(embedding1) * norm(embedding2))
    return sim

def synonyme (query):
    for i in range (len (synonymes)):
        for j in range (len (synonymes [i])):
            if query [:len (synonymes [i] [j])].lower () == synonymes [i] [j].lower ():
                #print (query [:len (synonymes [i] [j])], ' -> ', synonymes [i] [0].lower ())
                return synonymes [i] [0].lower ()

    return query.lower ()

def premierMot (query):
    w = ""
    for i in range (len (query)):
        if query [i] != ' ':
            w += query [i]
        else:
            return w
    return w

def compte (indexSum, indexLabels, motCles):
    res = 0
    line = 0
    for result in rowsFEC:
        line = line + 1
        useLine = True
        for i in range (len (indexLabels)):
            if indexLabels [i] != indexSum:
                if result [indexLabels [i]].lower () != motCles [i].lower ():
                    #print (result [indexLabels [i]], motCles [i])
                    useLine = False
                    break
        if useLine:
            string = result [indexSum]
            f = replaceNumber (string)
            if f == '':
                print (line, result, string)
            elif f != False:
                res += float (f)
                #print (float (f), string, f)
                #print (result)
    return res

def compteDate (indexSum, indexLabels, motCles, indexDate, firstDate, lastDate):
    res = 0
    line = 0
    for result in rowsFEC:
        line = line + 1
        useLine = True
        for i in range (len (indexLabels)):
            if indexLabels [i] != indexSum:
                if result [indexLabels [i]] [:len (motCles [i])].lower () != motCles [i].lower ():
                    #if (result [indexLabels [i]] [:6].lower () == 'decais'):
                    #    print (result [indexLabels [i]], motCles [i])
                    useLine = False
                    break
        #if useLine:
        #    print (result)
        string = result [indexDate]
        day,month,year = string.split ('/')
        d = date (int (year), int (month), int (day))
        if d < firstDate or d > lastDate:
            useLine = False
        #print (d, firstDate, d < firstDate, lastDate, d > lastDate, useLine)
        if useLine:
            string = result [indexSum]
            f = replaceNumber (string)
            if f == '':
                print (line, result, string)
            elif f != False:
                res += float (f)
                #print (float (f), string, f)
                #print (result)
    return res

def printDate (indexSum, indexLabels, motCles, indexDate):
    oneDate = False
    lastDate = date(1800,1,1)
    line = 0
    for result in rowsFEC:
        line = line + 1
        useLine = True
        for i in range (len (indexLabels)):
            if indexLabels [i] != indexSum:
                if result [indexLabels [i]] [:len (motCles [i])].lower () != motCles [i].lower ():
                    #if (result [indexLabels [i]] [:6].lower () == 'decais'):
                    #    print (result [indexLabels [i]], motCles [i])
                    useLine = False
                    break
        if useLine:
            string = result [indexDate]
            day,month,year = string.split ('/')
            d = date (int (year), int (month), int (day))
            if d > lastDate:
                lastDate = d
                oneDate = True
    if oneDate == False:
        sys.stdout.write ("Je n'ai pas trouvé cet évènement ")
        if len (indexLabels) == 1:
            sys.stdout.write ("en prenant comme critère ")
        else:
            sys.stdout.write ("en prenant comme critères ")
        for lab in range (len (indexLabels)):
            sys.stdout.write (motCles [lab])
            if lab < len (indexLabels) - 1:
                sys.stdout.write (' et ')
        sys.stdout.write ("\n")
    else:
        if len (indexLabels) == 1:
            sys.stdout.write ("La date demandée en prenant comme critère ")
        else:
            sys.stdout.write ("La date demandée en prenant comme critères ")
        for lab in range (len (indexLabels)):
            sys.stdout.write (motCles [lab])
            if lab < len (indexLabels) - 1:
                sys.stdout.write (' et ')
        sys.stdout.write (" est le " + str(lastDate) + "\n")
 
def printDerniereDate (indexSum, indexLabels, motCles, indexDate):
    oneDate = False
    lastDate = date(1800,1,1)
    line = 0
    resString = ''
    for result in rowsFEC:
        line = line + 1
        useLine = True
        for i in range (len (indexLabels)):
            if indexLabels [i] != indexSum:
                if result [indexLabels [i]] [:len (motCles [i])].lower () != motCles [i].lower ():
                    #if (result [indexLabels [i]] [:6].lower () == 'decais'):
                    #    print (result [indexLabels [i]], motCles [i])
                    useLine = False
                    break
        if useLine:
            string = result [indexDate]
            day,month,year = string.split ('/')
            d = date (int (year), int (month), int (day))
            if d > lastDate:
                lastDate = d
                oneDate = True
                string = result [indexSum]
                f = replaceNumber (string)
                resString = "{:.2f}".format(float (f))
    if oneDate == False:
        sys.stdout.write ("Je n'ai pas trouvé cet évènement ")
        if len (indexLabels) == 1:
            sys.stdout.write ("en prenant comme critère ")
        else:
            sys.stdout.write ("en prenant comme critères ")
        for lab in range (len (indexLabels)):
            sys.stdout.write (motCles [lab])
            if lab < len (indexLabels) - 1:
                sys.stdout.write (' et ')
        sys.stdout.write ("\n")
    else:
        if len (indexLabels) == 1:
            sys.stdout.write ("La somme demandée en prenant comme critère ")
        else:
            sys.stdout.write ("La somme demandée en prenant comme critères ")
        for lab in range (len (indexLabels)):
            sys.stdout.write (motCles [lab])
            if lab < len (indexLabels) - 1:
                sys.stdout.write (' et ')
        sys.stdout.write (" est de " + resString + " le " + str(lastDate) + "\n")
 
def listeComptes (indexSum, indexLabels, motCles, indexDate, firstDate, lastDate, indexCompteLib, indexCompteAuxLib):
    comptes = []
    line = 0
    for result in rowsFEC:
        line = line + 1
        useLine = True
        for i in range (len (indexLabels)):
            if indexLabels [i] != indexSum:
                if result [indexLabels [i]] [:len (motCles [i])].lower () != motCles [i].lower ():
                    #if (result [indexLabels [i]] [:6].lower () == 'decais'):
                    #    print (result [indexLabels [i]], motCles [i])
                    useLine = False
                    break
        #if useLine:
        #    print (result)
        string = result [indexDate]
        day,month,year = string.split ('/')
        d = date (int (year), int (month), int (day))
        if d < firstDate or d > lastDate:
            useLine = False
        #print (d, firstDate, d < firstDate, lastDate, d > lastDate, useLine)
        if useLine:
            string = [result [indexCompteLib], result [indexCompteAuxLib]]
            if string not in comptes:
                comptes.append (string)
    return comptes

def compteDateDetail (indexSum, indexLabels, motCles, indexDate, firstDate, lastDate, indexCompteLib, indexCompteAuxLib):
    comptes= listeComptes (indexSum, indexLabels, motCles, indexDate, firstDate, lastDate, indexCompteLib,indexCompteAuxLib)
    if debug:
        print (comptes)
    total = 0.0
    for compte in comptes:
        res = 0
        line = 0
        for result in rowsFEC:
            line = line + 1
            useLine = True
            for i in range (len (indexLabels)):
                if indexLabels [i] != indexSum:
                    if result [indexLabels [i]] [:len (motCles [i])].lower () != motCles [i].lower ():
                        #if (result [indexLabels [i]] [:6].lower () == 'decais'):
                        #    print (result [indexLabels [i]], motCles [i])
                        useLine = False
                        break
            string = result [indexDate]
            day,month,year = string.split ('/')
            d = date (int (year), int (month), int (day))
            if d < firstDate or d > lastDate:
                useLine = False
            if result [indexCompteLib] != compte [0]:
                useLine = False
            if result [indexCompteAuxLib] != compte [1]:
                useLine = False
            if useLine:
                string = result [indexSum]
                f = replaceNumber (string)
                if f == '':
                    print (line, result, string)
                elif f != False:
                    res += float (f)
        print (compte [0], ';', compte [1], ';', round (res,2))
        total += res
    print ('Total du ' + str (firstDate) + ' au ' + str (lastDate) + ' : ' + str (round (total,2)))

from datetime import *

mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

def yearMonth (indexDate, m):
    for result in rowsFEC:
        string = result [indexDate]
        day,month,year = string.split ('/')
        #print (int (day),int (month), int (year))
        if m == int (month):
            return int (year)
    return date.today ().year

def lastDayMonth (indexDate, m):
    lastDay = 1
    for result in rowsFEC:
        string = result [indexDate]
        day,month,year = string.split ('/')
        if int (month) == m:
            if int (day) > lastDay:
                lastDay = int (day)
    return lastDay

datesDebut = [["en janvier", 1, 1, 1, 31],
              ["de janvier", 1, 1, 1, 31],
              ["en fevrier", 2, 1, 2, 28],
              ["de fevrier", 2, 1, 2, 28],
              ["en mars", 3, 1, 3, 31],
              ["de mars", 3, 1, 3, 31],
              ["en avril", 4, 1, 4, 30],
              ["d avril", 4, 1, 4, 30],
              ["en mai", 5, 1, 5, 31],
              ["de mai", 5, 1, 5, 31],
              ["en juin", 6, 1, 6, 30],
              ["de juin", 6, 1, 6, 30],
              ["de juillet", 7, 1, 7, 31],
              ["en juillet", 7, 1, 7, 31],
              ["en aout", 8, 1, 8, 31],
              ["d aout", 8, 1, 8, 31],
              ["en septembre", 9, 1, 9, 30],
              ["de septembre", 9, 1, 9, 30],
              ["en octobre", 10, 1, 10, 31],
              ["d octobre", 10, 1, 10, 31],
              ["en novembre", 11, 1, 11, 30],
              ["de novembre", 11, 1, 11, 30],
              ["en decembre", 12, 1, 12, 31],
              ["de decembre", 12, 1, 12, 31]
              ]

datesFin = [["a fin janvier", 1, 31],
            ["a janvier", 1, 31],
            ["a fin fevrier", 2, 28],
            ["a fevrier", 2, 28],
            ["a fin mars", 3, 31],
            ["a mars", 3, 31],
            ["a fin avril", 4, 30],
            ["a avril", 4, 30],
            ["a fin mai", 5, 31],
            ["a mai", 5, 31],
            ["a fin juin", 6, 30],
            ["a juin", 6, 30],
            ["a fin juillet", 7, 31],
            ["a juillet", 7, 31],
            ["a fin aout", 8, 31],
            ["a aout", 8, 31],
            ["a fin septembre", 9, 30],
            ["a septembre", 9, 30],
            ["a fin octobre", 10, 31],
            ["a octobre", 10, 31],
            ["a fin novembre", 11, 30],
            ["a novembre", 11, 30],
            ["a fin decembre", 12, 31],
            ["a decembre", 12, 31]
            ]

def dernierMois ():
    first = date.today ()
    m = first.month - 1
    if m < 0:
        m = 0
    return m

def dates (indexDate, query):
    global debug
    q = query.lower ()
    if debug:
        print (q)
    first = date.today ()
    last = date (1800, 1, 1)
    yearEnd = first.year
    yearBegin = first.year
    for result in rowsFEC:
        string = result [indexDate]
        day,month,year = string.split ('/')
        if int(year) < yearBegin:
            yearBegin = int(year)
        d = date (int (year), int (month), int (day))
        if d < first:
            first = d
        if d > last:
            last = d
    for s in datesDebut:
        if q.find (s [0]) != -1:
            first = date (yearBegin, s [1], s [2])
            lastDay = s [4]
            if yearBegin == 2024 and s [3] == 2:
                lastDay = 29
            last = date (yearBegin, s [3], s [4])
    for s in datesFin:
        if q.find (s [0]) != -1:
            lastDay = s [2]
            if yearBegin == 2024 and s [1] == 2:
                lastDay = 29
            last = date (yearBegin, s [1], lastDay)
    #print ("first :", first)
    #print ("last :", last)
    return first,last

def answerQuery (query, fff = [], printAnswer = True):
    listLabels = []
    motsCles = []
    Racine3 = False
    for lab in range (len (labels)):
        if labels [lab].find ('montant') != -1:
            indexSum = lab
        if labels [lab].find ('mois') != -1:
            indexMois = lab
        if labels [lab].find ('comptelib') != -1:
            indexCompteLib = lab
        if labels [lab].find ('compauxlib') != -1:
            indexCompteAuxLib = lab
        if labels [lab].find ('ecrituredate') != -1:
            indexDate = lab
    # recupere les mots cles de MotsCles.csv dans la question
    for lab in range (len (labels)):
        for row in range (len (rows)):
            if len (rows [row] [lab]) > 0:
                for i in range (len (query)):
                    startWord = False
                    if i == 0:
                        startWord = True
                    elif query [i - 1] == ' ':
                        startWord = True
                    if startWord:
                        w = synonyme (query [i:])
                        if len (w) >= len (rows [row] [lab]):
                            #print (w.lower (), rows [row] [lab].lower ())
                            if w [:len (rows [row] [lab])].lower () == rows [row] [lab].lower ():
                            #if w == rows [row] [lab] [:len (w)].lower ():
                                if True:
                                    print (rows [row] [lab], row, lab, labels [lab])
                                if not lab in listLabels:
                                    Specifique = False
                                    if Racine3:
                                        if labels [lab].find ('racine 4') != -1 or labels [lab].find ('racine 5') != -1:
                                            Specifique = True
                                    if not Specifique:
                                        listLabels.append (lab)
                                        motsCles.append (rows [row] [lab])
                                    if labels [lab].find ('racine 3') != -1:
                                        Racine3 = True
                                    if labels [lab].find ('montant') != -1:
                                        indexSum = lab

    # recupere les fournisseurs dans la question
    for f in fff:
        listLabels.append (indexFournisseurs)
        motsCles.append (f.lower ())

        #for i in range (len (query)):
        #    startWord = False
        #    if i == 0:
        #        startWord = True
        #    elif query [i - 1] == ' ':
        #        startWord = True
        #    if startWord:
        #        w = premierMot (query [i:])
        #        if w.lower () == f.lower ():
        #            listLabels.append (indexFournisseurs)
        #            motsCles.append (f.lower ())

    if len (listLabels) == 0:
        if printAnswer:
            sys.stdout.write ("Je n'ai pas compris votre question.\n")
        else:
            sys.stdout.write ("Je n'ai pas compris '" + query + "'.\n")
        return 0.0
    else:
        if True:
            print ('Labels')
            for lab in range (len (listLabels)):
                print (labels [listLabels [lab]], motsCles [lab])

        firstDate,lastDate = dates (indexDate, query)
        if debug:
            print ('Dates: du', firstDate, 'au', lastDate)
    
        #res = compte (indexSum, listLabels, motsCles)
        res = compteDate (indexSum, listLabels, motsCles, indexDate, firstDate, lastDate)
        if res < 0:
            res = -res
        resString = "{:.2f}".format(res)
        if printAnswer == False:
            return res
        if query.find ('detail') > -1 and (query.find ('par mois') > -1 or query.find ('mensuel') > -1):
            listlabels = copy.deepcopy (listLabels)
            if indexMois not in listlabels:
                listlabels.append (indexMois)
                for m in range (0, 12):
                    year = yearMonth (indexDate, m + 1)
                    firstDate = date (year, m + 1, 1)
                    lastDate = date (year, m + 1, lastDayMonth (indexDate, m + 1))
                    print (mois [m])
                    compteDateDetail (indexSum, listLabels, motsCles, indexDate, firstDate, lastDate, indexCompteLib, indexCompteAuxLib)
        elif query.find ('du dernier mois') > -1:
            listlabels = copy.deepcopy (listLabels)
            listlabels.append (indexMois)
            m = dernierMois ()
            year = yearMonth (indexDate, m)
            firstDate = date (year, m, 1)
            lastDate = date (year, m, lastDayMonth (indexDate, m + 1))
            print (mois [m])
            compteDateDetail (indexSum, listLabels, motsCles, indexDate, firstDate, lastDate, indexCompteLib, indexCompteAuxLib)
        elif query.find ('detail') > -1:
            compteDateDetail (indexSum, listLabels, motsCles, indexDate, firstDate, lastDate, indexCompteLib, indexCompteAuxLib)
        elif query.find ('quand') > -1:
            printDate (indexSum, listLabels, motsCles, indexDate)
        elif query.find ('le dernier') > -1 or query.find ('la derniere') > -1:
            printDerniereDate (indexSum, listLabels, motsCles, indexDate)
        elif query.find ('par mois') > -1 or query.find ('mensuel') > -1:                
            listlabels = copy.deepcopy (listLabels)
            if indexMois not in listlabels:
                listlabels.append (indexMois)
                for m in range (0, 12):
                    year = yearMonth (indexDate, m + 1)
                    firstDate = date (year, m + 1, 1)
                    lastDate = date (year, m + 1, lastDayMonth (indexDate, m + 1))
                    #print (firstDate, lastDate)
                    resMois = compteDate (indexSum, listLabels, motsCles, indexDate, firstDate, lastDate)
                    if res != 0.0:
                        print (mois [m], ";", "{:.2f}".format(resMois), ";", "{:.2f}%".format(100 * resMois / res, 2))
                    else:
                        print (mois [m], ";", "{:.2f}".format(resMois))
        else:
            if len (listLabels) == 1:
                sys.stdout.write ("Le montant demandé en prenant comme critère ")
            else:
                sys.stdout.write ("Le montant demandé en prenant comme critères ")
            for lab in range (len (listLabels)):
                sys.stdout.write (motsCles [lab])
                sys.stdout.write (' dans la colonne ')
                sys.stdout.write (labels [listLabels [lab]])
                if lab < len (listLabels) - 1:
                    sys.stdout.write (' et ')
            sys.stdout.write (", sur la période du " + str (firstDate) + " au " + str(lastDate) + ", ")
            sys.stdout.write ("est de " + resString + " euros.\n")
        return res

def separate (query):
    L = []
    inducteur = ''
    first = 0
    for i in range (len (query)): # -13 ne voit pas hors stocks
        if query [i : i + 4] == ' et ':
            inducteur = 'et'
            L.append (query [first : i])
            first = i + 4
        elif query [i : i + 13] == ' par rapport ':
            inducteur = 'par rapport'
            L.append (query [first : i])
            first = i + 13
        elif query [i : i + 6] == ' plus ':
            inducteur = 'plus'
            L.append (query [first : i])
            first = i + 6
        elif query [i : i + 8] == ' versus ':
            inducteur = 'versus'
            L.append (query [first : i])
            first = i + 8
        elif query [i : i + 6] == ' hors ':
            inducteur = 'hors'
            L.append (query [first : i])
            first = i + 6
    L.append (query [first :])
    return L,inducteur

            
while (True):
    query = input ('')
    if query == 'quit':
        break

    '''
    words = query.split ()
    # find those words that may be misspelled
    misspelled = french.unknown(words)

    for word in misspelled:
        # Get the one `most likely` answer
        correction = french.correction(word)
        print(word, '->', correction)
        query.replace (word, correction)
    '''
    
    xxx,mmm,fff = MotsCles (query)
    if debug:
        print (xxx, mmm, fff)
    besti,best,bestq = indexEmbedding (query, xxx, mmm, fff)
    if debug:
        print ('besti', besti)
    if besti == -1:
        print ("Je n'ai pas trouvé la question dans similarity.csv")
        continue
    # fournisseur qui est un mot de la question : 'par mois' et 'par' est un fournisseur
    for f in fff:
        if f.lower () in questions [besti] [1]:
            fff.remove (f)
    q = replaceMotsCles (questions [besti] [1], xxx, mmm, fff, [])
    if True:
        print ('Question =', bestq, best, 'Question reformatée =', q)
    #reponsei = -1
    #for i in range (3, len (reponses)):
    #    if reponses [i] [0] == questions [besti] [1]:
    #        reponsei = i
    #if reponsei == -1:
    #    print ("Je n'ai pas trouvé la question reformatée dans reponses.csv")
    #    continue
    #for i in range (1, len(reponses [reponsei])):
    #    q = replaceMotsCles (reponses [reponsei] [i], xxx, mmm, fff)
    #    sys.stdout.write (q)
    #sys.stdout.write ('\n')
    
    q = replaceSpecial (q)
    listQueries,inducteur = separate (q)
    print (listQueries, inducteur)
    vvv = []
    if len(listQueries) == 1:
        res = answerQuery (listQueries [0], fff) #, False)
        resString = "{:.2f}".format(res)
        vvv = [resString]
    elif inducteur == 'et':
        for q in listQueries:
            res = answerQuery (q)
            resString = "{:.2f}".format(res)
            vvv.append (resString)
    elif inducteur == 'plus':
        res = 0.0
        for q in listQueries:
            res += answerQuery (q, printAnswer = False)
        resString = "{:.2f}".format(res)
        sys.stdout.write ("La somme est de " + resString + " euros.\n")
        vvv = [resString]
    elif inducteur == 'par rapport':
        res0 = answerQuery (listQueries [0], printAnswer = False)
        res1 = answerQuery (listQueries [1], printAnswer = False)
        res = 0.0
        if res1 != 0.0:
            res = res0 / res1
        resString = "{:.2f}".format(res)
        sys.stdout.write ("Le ratio est de " + resString + "\n")
        vvv = [resString]
    elif inducteur == 'versus':
        res0 = answerQuery (listQueries [0], printAnswer = False)
        res1 = answerQuery (listQueries [1], printAnswer = False)
        resString0 = "{:.2f}".format(res0)
        resString1 = "{:.2f}".format(res1)
        sys.stdout.write (resString0 + " euros versus " + resString1 + " euros.\n")
        vvv = [resString0, resString1]
    elif inducteur == 'hors':
        res0 = answerQuery (listQueries [0], printAnswer = True)
        res1 = answerQuery (listQueries [0] + ' ' + listQueries [1], printAnswer = True)
        res = res0 - res1
        resString = "{:.2f}".format(res)
        sys.stdout.write (resString + " euros.\n")
        vvv = [resString]

    for i in range (2, len(questions [besti])):
        q = replaceMotsCles (questions [besti] [i], xxx, mmm, fff, vvv)
        sys.stdout.write (q)
    sys.stdout.write ('\n')
