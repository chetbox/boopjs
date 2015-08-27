.class public Lcom/chetbox/twitter/android/TwitterApplication;
.super Lcom/chetbox/twitter/android/YetAnotherApplication;
.source "TwitterApplication.java"


# static fields
.field public static final TWITTER_KEY:Ljava/lang/String; = "etuz0S4EzzLsMSt0sPVPKRZBh"

.field public static final TWITTER_SECRET:Ljava/lang/String; = "fMH5rt5suKWqa1vLSfMIWJFBvu7GNoI6yglcXBLdKtEZnhKqsz"


# direct methods
.method public constructor <init>()V
    .registers 1

    .prologue
    .line 8
    invoke-direct {p0}, Lcom/chetbox/twitter/android/YetAnotherApplication;-><init>()V

    return-void
.end method


# virtual methods
.method public onCreate()V
    .registers 5

    .prologue
    .line 16
    invoke-super {p0}, Lcom/chetbox/twitter/android/YetAnotherApplication;->onCreate()V

    .line 18
    new-instance v0, Lcom/twitter/sdk/android/core/TwitterAuthConfig;

    const-string v1, "etuz0S4EzzLsMSt0sPVPKRZBh"

    const-string v2, "fMH5rt5suKWqa1vLSfMIWJFBvu7GNoI6yglcXBLdKtEZnhKqsz"

    invoke-direct {v0, v1, v2}, Lcom/twitter/sdk/android/core/TwitterAuthConfig;-><init>(Ljava/lang/String;Ljava/lang/String;)V

    .line 19
    .local v0, "authConfig":Lcom/twitter/sdk/android/core/TwitterAuthConfig;
    const/4 v1, 0x1

    new-array v1, v1, [Lio/fabric/sdk/android/Kit;

    const/4 v2, 0x0

    new-instance v3, Lcom/twitter/sdk/android/Twitter;

    invoke-direct {v3, v0}, Lcom/twitter/sdk/android/Twitter;-><init>(Lcom/twitter/sdk/android/core/TwitterAuthConfig;)V

    aput-object v3, v1, v2

    invoke-static {p0, v1}, Lio/fabric/sdk/android/Fabric;->with(Landroid/content/Context;[Lio/fabric/sdk/android/Kit;)Lio/fabric/sdk/android/Fabric;

    .line 20
    return-void
.end method
